import { cacheLife, cacheTag } from 'next/cache';

import { isDefaultListing, type ListingParams } from '@/lib/helpers/listing-params';

import { sdk } from '../client';
import { CACHE_TAGS, cacheFailedRead } from './cache-tags';
import { getAttributeCatalog } from './products';
import { getRegion } from './regions';
import { listSellers } from './seller';

export const PRODUCT_INDEX = 'product';

/** A hit of the `product` search index: one document per product and currency. */
export type ListingProduct = {
  id: string;
  product_id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  min_price: number;
  currency_code: string;
  created_at: string;
};

export type FacetValue = { value: string; label: string; count: number };

export type ListingFacets = {
  attributes: { handle: string; name: string; values: FacetValue[] }[];
  sellers: FacetValue[];
  price: { min: number; max: number; currency_code: string } | null;
};

export type ListingResult = {
  products: ListingProduct[];
  count: number;
  facets: ListingFacets;
  currency_code: string;
};

export type ListingScope = {
  countryCode: string;
  category_ids?: string | string[];
  collection_id?: string;
  limit: number;
};

type SearchHit = { id: string; document: Record<string, unknown> };

type SearchResponse = {
  results: {
    hits: SearchHit[];
    metadata: { count: number | null };
    facets?: Record<
      string,
      | { type: 'value'; values: { value: string; count: number }[] }
      | { type: 'stats'; min: number; max: number; count: number }
    >;
  }[];
};

const EMPTY_FACETS: ListingFacets = { attributes: [], sellers: [], price: null };

const attributeKey = (handle: string, value: string) => `${handle}:${value}`;

const buildFilters = (
  scope: ListingScope,
  params: ListingParams,
  currencyCode: string
) => {
  const and: Record<string, unknown>[] = [];

  if (scope.category_ids?.length) {
    and.push({ category_ids: { $in: ([] as string[]).concat(scope.category_ids) } });
  }
  if (scope.collection_id) {
    and.push({ collection_id: scope.collection_id });
  }
  if (params.sellers.length) {
    and.push({ seller_handles: { $in: params.sellers } });
  }
  for (const [handle, values] of Object.entries(params.attributes)) {
    and.push({
      attribute_values: { $in: values.map((value) => attributeKey(handle, value)) },
    });
  }
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    and.push({
      min_price: {
        ...(params.minPrice !== undefined ? { $gte: params.minPrice } : {}),
        ...(params.maxPrice !== undefined ? { $lte: params.maxPrice } : {}),
      },
    });
  }

  return {
    ...(params.query ? { q: params.query } : {}),
    currency_code: currencyCode,
    ...(and.length ? { $and: and } : {}),
  };
};

const buildOrder = (params: ListingParams): Record<string, 'ASC' | 'DESC'> => {
  switch (params.sortBy) {
    case 'price_asc':
      return { min_price: 'ASC' };
    case 'price_desc':
      return { min_price: 'DESC' };
    default:
      return params.query ? { _score: 'DESC' } : { created_at: 'DESC' };
  }
};

const toProduct = (hit: SearchHit): ListingProduct => {
  const doc = hit.document;
  return {
    id: String(doc.id ?? hit.id),
    product_id: String(doc.product_id ?? ''),
    handle: String(doc.handle ?? ''),
    title: String(doc.title ?? ''),
    thumbnail: typeof doc.thumbnail === 'string' ? doc.thumbnail : null,
    min_price: Number(doc.min_price ?? 0),
    currency_code: String(doc.currency_code ?? ''),
    created_at: String(doc.created_at ?? ''),
  };
};

const fetchListing = async (
  scope: ListingScope,
  params: ListingParams
): Promise<ListingResult & { failed?: boolean }> => {
  const region = await getRegion(scope.countryCode);
  if (!region?.currency_code) {
    return { products: [], count: 0, facets: EMPTY_FACETS, currency_code: '', failed: true };
  }
  const currencyCode = region.currency_code.toLowerCase();

  const body = {
    entity: PRODUCT_INDEX,
    filters: buildFilters(scope, params, currencyCode),
    pagination: {
      skip: Math.max(params.page - 1, 0) * scope.limit,
      take: scope.limit,
      order: buildOrder(params),
    },
    search_options: {
      facets: [
        { field: 'attribute_values', type: 'value', limit: 500 },
        { field: 'seller_handles', type: 'value', limit: 200 },
        { field: 'min_price', type: 'stats' },
      ],
      // A selected value keeps its siblings' counts, so a shopper can widen a
      // filter without clearing it first.
      disjunctive_facets: true,
      count: 'exact',
    },
  };

  const [response, catalog, sellers] = await Promise.all([
    (
      sdk.store.search.mutate({
        ...body,
        fetchOptions: { cache: 'no-store' },
      } as never) as unknown as Promise<SearchResponse>
    ).catch(() => null),
    getAttributeCatalog(),
    listSellers(),
  ]);

  const result = response?.results?.[0];
  if (!result) {
    return { products: [], count: 0, facets: EMPTY_FACETS, currency_code: currencyCode, failed: true };
  }

  const facetValues = (field: string) => {
    const facet = result.facets?.[field];
    return facet?.type === 'value' ? facet.values : [];
  };

  const countsByAttribute = new Map<string, Map<string, number>>();
  for (const { value, count } of facetValues('attribute_values')) {
    const separator = value.indexOf(':');
    if (separator < 0) continue;
    const handle = value.slice(0, separator);
    const name = value.slice(separator + 1);
    let counts = countsByAttribute.get(handle);
    if (!counts) {
      counts = new Map();
      countsByAttribute.set(handle, counts);
    }
    counts.set(name, count);
  }

  const attributes = catalog
    .map((attribute) => {
      const counts = countsByAttribute.get(attribute.handle) ?? new Map<string, number>();
      const known = new Set<string>();
      const values: FacetValue[] = attribute.values.map((value) => {
        known.add(value);
        return { value, label: value, count: counts.get(value) ?? 0 };
      });
      for (const [value, count] of counts) {
        if (!known.has(value)) values.push({ value, label: value, count });
      }
      return { handle: attribute.handle, name: attribute.name, values };
    })
    .filter((attribute) => attribute.values.some((value) => value.count > 0));

  const sellerNames = new Map(sellers.map((seller) => [seller.handle, seller.name]));
  const sellerCounts = new Map(
    facetValues('seller_handles').map(({ value, count }) => [value, count])
  );
  // A selected seller stays listed (and labelled) even when nothing matches.
  for (const handle of params.sellers) {
    if (!sellerCounts.has(handle)) sellerCounts.set(handle, 0);
  }
  const sellerFacet: FacetValue[] = Array.from(sellerCounts, ([value, count]) => ({
    value,
    label: sellerNames.get(value) ?? value,
    count,
  })).sort((a, b) => a.label.localeCompare(b.label));

  const stats = result.facets?.min_price;
  const price =
    stats?.type === 'stats' && stats.count > 0
      ? { min: Math.floor(stats.min), max: Math.ceil(stats.max), currency_code: currencyCode }
      : null;

  return {
    products: result.hits.map(toProduct),
    count: result.metadata.count ?? result.hits.length,
    facets: { attributes, sellers: sellerFacet, price },
    currency_code: currencyCode,
  };
};

const getDefaultListing = async (
  scope: ListingScope,
  params: ListingParams
): Promise<ListingResult> => {
  'use cache';
  cacheLife('max');
  cacheTag(CACHE_TAGS.products);

  const { failed, ...result } = await fetchListing(scope, params);
  if (failed) {
    cacheFailedRead();
  }
  return result;
};

export const searchListing = async (
  scope: ListingScope,
  params: ListingParams
): Promise<ListingResult> => {
  if (isDefaultListing(params)) {
    return getDefaultListing(scope, params);
  }
  const { failed: _failed, ...result } = await fetchListing(scope, params);
  return result;
};
