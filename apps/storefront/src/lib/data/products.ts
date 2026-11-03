import { HttpTypes } from '@medusajs/types';
import { cacheLife, cacheTag } from 'next/cache';

import { sdk } from '../client';
import { CACHE_TAGS, cacheFailedRead } from './cache-tags';
import { getRegion, retrieveRegion } from './regions';

// Every field is `+`-prefixed so it merges with the route defaults, which
// already carry the linked attribute values the product page displays.
const PRODUCT_LIST_FIELDS =
  '+variants.calculated_price,+variants.inventory_quantity,+variants.options.*';

export type AttributeCatalogEntry = {
  handle: string;
  name: string;
  is_variant_axis: boolean;
  values: string[];
};

type StoreProductAttribute = {
  handle: string;
  name: string;
  is_variant_axis: boolean;
  values?: { name: string; rank?: number }[];
};

type ProductQueryParams = HttpTypes.FindParams &
  HttpTypes.StoreProductParams & { handle?: string[] };

type ProductListResult = {
  response: { products: HttpTypes.StoreProduct[]; count: number };
  nextPage: number | null;
  queryParams?: ProductQueryParams;
};

const queryProducts = (query: Record<string, unknown>) =>
  sdk.store.products.query({
    fields: PRODUCT_LIST_FIELDS,
    ...query,
    fetchOptions: { cache: 'no-store' },
  } as never) as unknown as Promise<{ products: HttpTypes.StoreProduct[]; count: number }>;

/**
 * The filterable global attributes in operator order with their full value
 * lists. Facet counts come from the search index; this supplies names, order
 * and the values that currently match nothing.
 */
export const getAttributeCatalog = async (): Promise<AttributeCatalogEntry[]> => {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.products);

  const { product_attributes } = await (
    sdk.store.productAttributes.query({
      is_filterable: true,
      limit: 100,
      order: 'rank',
      fields: 'handle,name,is_variant_axis,values.name,values.rank',
      fetchOptions: { cache: 'no-store' },
    } as never) as unknown as Promise<{
      product_attributes: StoreProductAttribute[];
    }>
  ).catch(() => {
    cacheFailedRead();
    return { product_attributes: [] as StoreProductAttribute[] };
  });

  return product_attributes.map((attribute) => ({
    handle: attribute.handle,
    name: attribute.name,
    is_variant_axis: attribute.is_variant_axis,
    values: (attribute.values ?? [])
      .slice()
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .map((value) => value.name),
  }));
};

/**
 * Products in Mercur are master products from a single shared catalog — they are
 * not owned by a seller. Seller-scoped listings and per-seller price/inventory
 * come from offers, not from a product→seller relation; use `lib/data/offers.ts`.
 *
 * Catalog reads are anonymous so every shopper shares one cache entry; prices
 * that depend on the customer's groups are applied by the cart, not the catalog.
 */
export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  category_id,
  collection_id,
}: {
  pageParam?: number;
  queryParams?: ProductQueryParams;
  category_id?: string | string[];
  collection_id?: string;
  countryCode?: string;
  regionId?: string;
}): Promise<ProductListResult> => {
  'use cache';
  cacheLife('max');
  cacheTag(CACHE_TAGS.products);

  if (!countryCode && !regionId) {
    throw new Error('Country code or region ID is required');
  }

  const limit = queryParams?.limit || 12;
  const _pageParam = Math.max(pageParam, 1);
  const offset = (_pageParam - 1) * limit;

  const region = countryCode
    ? await getRegion(countryCode)
    : await retrieveRegion(regionId!);

  if (!region) {
    cacheFailedRead();
    return { response: { products: [], count: 0 }, nextPage: null };
  }

  for (const handle of queryParams?.handle ?? []) {
    cacheTag(CACHE_TAGS.product(handle));
  }

  return queryProducts({
    category_id,
    collection_id,
    limit,
    offset,
    region_id: region.id,
    ...queryParams,
  })
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null;

      return {
        response: { products, count },
        nextPage,
        queryParams,
      };
    })
    .catch(() => {
      cacheFailedRead();
      return {
        response: { products: [], count: 0 },
        nextPage: null,
        queryParams,
      };
    });
};

