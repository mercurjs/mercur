import { HttpTypes } from '@medusajs/types';
import { cacheLife, cacheTag } from 'next/cache';

import { sortProducts } from '@/lib/helpers/sort-products';
import { SortOptions } from '@/types/product';

import { sdk } from '../client';
import { CACHE_TAGS, cacheFailedRead } from './cache-tags';
import { getRegion, retrieveRegion } from './regions';

const PRODUCT_LIST_FIELDS =
  '*variants.calculated_price,+variants.inventory_quantity,*variants.options,*attribute_values,*attribute_values.attribute';

export type SearchFacetBucket = { value: string; count: number };

/**
 * Storefront filter facets. `attributes` is keyed by the global product
 * attribute handle (e.g. `size`, `color`, `condition`); each entry is the list
 * of selectable values. Backed by `GET /store/product-attributes`.
 */
export type SearchFacets = {
  attributes: Record<string, SearchFacetBucket[]>;
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

export const getSearchFacets = async (): Promise<SearchFacets> => {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.products);

  const { product_attributes } = await (
    sdk.store.productAttributes.query({
      is_filterable: true,
      limit: 100,
      fields: 'handle,name,is_variant_axis,values.name,values.rank',
      fetchOptions: { cache: 'no-store' },
    } as never) as unknown as Promise<{
      product_attributes: StoreProductAttribute[];
    }>
  ).catch(() => {
    cacheFailedRead();
    return { product_attributes: [] as StoreProductAttribute[] };
  });

  const attributes: Record<string, SearchFacetBucket[]> = {};
  for (const attribute of product_attributes) {
    attributes[attribute.handle] = (attribute.values ?? [])
      .slice()
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .map((value) => ({
        value: value.name,
        count: 1,
      }));
  }

  return { attributes };
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

export type ProductSearchParams = {
  query?: string;
  countryCode?: string;
  regionId?: string;
  category_id?: string | string[];
  collection_id?: string | string[];
  seller_id?: string | string[];
  attributes?: Record<string, string | string[]>;
  page?: number;
  limit?: number;
  sortBy?: SortOptions;
};

export type ProductSearchResult = {
  products: HttpTypes.StoreProduct[];
  count: number;
  nextPage: number | null;
};

export const isDefaultProductSearch = ({
  query,
  attributes,
  page = 1,
  sortBy,
}: ProductSearchParams) =>
  !query &&
  page <= 1 &&
  (!sortBy || sortBy === 'created_at') &&
  !Object.keys(attributes ?? {}).length;

/**
 * Price sorts are applied after fetching because `/store/products` can only order
 * by product columns.
 */
const fetchProductSearch = async ({
  query,
  countryCode,
  regionId,
  category_id,
  collection_id,
  seller_id,
  attributes,
  page = 1,
  limit = 12,
  sortBy,
}: ProductSearchParams): Promise<ProductSearchResult & { failed?: boolean }> => {
  const region = countryCode ? await getRegion(countryCode) : { id: regionId };

  if (!region?.id) {
    return { products: [], count: 0, nextPage: null, failed: true };
  }

  const offset = Math.max(page - 1, 0) * limit;
  const order = !sortBy || sortBy === 'created_at' ? '-created_at' : undefined;

  const hasAttributeFilters = attributes && Object.keys(attributes).length > 0;

  const result = await queryProducts({
    ...(query ? { q: query } : {}),
    region_id: region.id,
    category_id,
    collection_id,
    seller_id,
    ...(hasAttributeFilters ? { attributes } : {}),
    order,
    limit,
    offset,
  }).catch(() => null);

  if (!result) {
    return { products: [], count: 0, nextPage: null, failed: true };
  }

  const ordered =
    sortBy === 'price_asc' || sortBy === 'price_desc'
      ? sortProducts(result.products, sortBy)
      : result.products;

  const nextPage = result.count > offset + limit ? page + 1 : null;

  return { products: ordered, count: result.count, nextPage };
};

// Only the default first page of a listing is cached: each filter, sort, query
// and page combination would be a rarely reused cache entry.
const getDefaultProductSearch = async (
  params: ProductSearchParams
): Promise<ProductSearchResult> => {
  'use cache';
  cacheLife('max');
  cacheTag(CACHE_TAGS.products);

  const { failed, ...result } = await fetchProductSearch(params);
  if (failed) {
    cacheFailedRead();
  }
  return result;
};

export const searchProducts = async (
  params: ProductSearchParams
): Promise<ProductSearchResult> => {
  if (isDefaultProductSearch(params)) {
    const { countryCode, regionId, category_id, collection_id, seller_id, limit } = params;
    return getDefaultProductSearch({ countryCode, regionId, category_id, collection_id, seller_id, limit });
  }

  const { failed: _failed, ...result } = await fetchProductSearch(params);
  return result;
};
