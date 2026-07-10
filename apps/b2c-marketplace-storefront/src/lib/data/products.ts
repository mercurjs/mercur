'use server';

import { HttpTypes } from '@medusajs/types';

import { sortProducts } from '@/lib/helpers/sort-products';
import { SortOptions } from '@/types/product';

import { sdk } from '../client';
import { getAuthHeaders, getCacheOptions } from './cookies';
import { getRegion, retrieveRegion } from './regions';

const PRODUCT_LIST_FIELDS =
  '*variants.calculated_price,+variants.inventory_quantity,*variants.options,*attribute_values,*attribute_values.attribute';

/**
 * Products in Mercur are master products from a single shared catalog — they are
 * not owned by a seller (see SPEC-015). Seller-scoped listings and per-seller
 * price/inventory come from offers, not from a product→seller relation; use
 * `lib/data/offers.ts` for that.
 */
export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  category_id,
  collection_id,
  forceCache = false,
}: {
  pageParam?: number;
  queryParams?: HttpTypes.FindParams &
    HttpTypes.StoreProductParams & { handle?: string[] };
  category_id?: string;
  collection_id?: string;
  countryCode?: string;
  regionId?: string;
  forceCache?: boolean;
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
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
    return { response: { products: [], count: 0 }, nextPage: null };
  }

  const useCached = forceCache || (limit <= 8 && !category_id && !collection_id);

  return (
    sdk.store.products.query({
      country_code: countryCode,
      category_id,
      collection_id,
      limit,
      offset,
      region_id: region.id,
      fields: PRODUCT_LIST_FIELDS,
      ...queryParams,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next: useCached ? { revalidate: 60 } : undefined,
        cache: useCached ? 'force-cache' : 'no-cache',
      },
    } as never) as unknown as Promise<{ products: HttpTypes.StoreProduct[]; count: number }>
  )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null;

      return {
        response: { products, count },
        nextPage,
        queryParams,
      };
    })
    .catch(() => ({
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }));
};

/**
 * Fetches up to 100 products into the Next.js cache and sorts them by `sortBy`,
 * then returns the page slice for `page`/`limit`.
 */
export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = 'created_at',
  countryCode,
  category_id,
  collection_id,
}: {
  page?: number;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
  sortBy?: SortOptions;
  countryCode: string;
  category_id?: string;
  collection_id?: string;
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
  const limit = queryParams?.limit || 12;

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: { ...queryParams, limit: 100 },
    category_id,
    collection_id,
    countryCode,
  });

  const pricedProducts = products.filter(prod =>
    prod.variants?.some(variant => variant.calculated_price !== null)
  );

  const sortedProducts = sortProducts(pricedProducts, sortBy);

  const pageParam = (page - 1) * limit;
  const nextPage = count > pageParam + limit ? pageParam + limit : null;
  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit);

  return {
    response: { products: paginatedProducts, count },
    nextPage,
    queryParams,
  };
};

export const getProductByHandle = async (handle: string, regionId: string) => {
  const next = { ...(await getCacheOptions('products')) };

  return (
    sdk.store.products.query({
      handle,
      region_id: regionId,
      fields: PRODUCT_LIST_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
      },
    } as never) as unknown as Promise<{ products: HttpTypes.StoreProduct[] }>
  ).then(({ products }) => products[0]);
};

export type SearchFacetBucket = { value: string; count: number };

export type SearchPriceRangeBucket = {
  gte: number | null;
  lte: number | null;
  count: number;
};

export type SearchFacets = {
  categories: SearchFacetBucket[];
  collections: SearchFacetBucket[];
  types: SearchFacetBucket[];
  tags: SearchFacetBucket[];
  attributes: Record<string, SearchFacetBucket[]>;
  price_ranges: SearchPriceRangeBucket[];
};

type SearchHit = { product_id: string };

const SEARCH_ORDER: Record<SortOptions, string> = {
  price_asc: 'price',
  price_desc: '-price',
  created_at: '-created_at',
};

/**
 * Full-text + faceted search backed by the Postgres search module
 * (`GET /store/search`). The search index returns product ids and facet
 * buckets; product cards are hydrated from `/store/products` so they carry
 * variants and calculated prices.
 */
export const searchProducts = async ({
  query,
  countryCode,
  regionId,
  category_id,
  collection_id,
  seller_id,
  type_id,
  tag_id,
  attributes,
  min_price,
  max_price,
  page = 1,
  limit = 12,
  sortBy,
}: {
  query?: string;
  countryCode?: string;
  regionId?: string;
  category_id?: string | string[];
  collection_id?: string | string[];
  seller_id?: string | string[];
  type_id?: string | string[];
  tag_id?: string | string[];
  attributes?: Record<string, string | string[]>;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
  sortBy?: SortOptions;
}): Promise<{
  products: HttpTypes.StoreProduct[];
  count: number;
  facets: SearchFacets;
  nextPage: number | null;
}> => {
  const region = countryCode ? await getRegion(countryCode) : { id: regionId };

  const emptyFacets: SearchFacets = {
    categories: [],
    collections: [],
    types: [],
    tags: [],
    attributes: {},
    price_ranges: [],
  };

  if (!region?.id) {
    return { products: [], count: 0, facets: emptyFacets, nextPage: null };
  }

  const offset = Math.max(page - 1, 0) * limit;
  const order = sortBy ? SEARCH_ORDER[sortBy] : query ? 'relevance' : '-created_at';

  const { hits, count, facets } = await (sdk.store.search.query({
    q: query || undefined,
    region_id: region.id,
    category_id,
    collection_id,
    seller_id,
    type_id,
    tag_id,
    attributes,
    min_price,
    max_price,
    offset,
    limit,
    order,
    fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-cache' },
  } as never) as unknown as Promise<{
    products: SearchHit[];
    count: number;
    facets: SearchFacets;
  }>)
    .then(res => ({ hits: res.products, count: res.count, facets: res.facets }))
    .catch(() => ({ hits: [] as SearchHit[], count: 0, facets: emptyFacets }));

  const nextPage = count > offset + limit ? page + 1 : null;
  const ids = hits.map(hit => hit.product_id);

  if (!ids.length) {
    return { products: [], count, facets, nextPage };
  }

  const {
    response: { products },
  } = await listProducts({
    pageParam: 1,
    regionId: region.id,
    queryParams: { id: ids, limit } as unknown as HttpTypes.StoreProductParams,
  });

  const byId = new Map(products.map(product => [product.id, product]));
  const ordered = ids
    .map(id => byId.get(id))
    .filter((product): product is HttpTypes.StoreProduct => Boolean(product));

  return { products: ordered, count, facets, nextPage };
};
