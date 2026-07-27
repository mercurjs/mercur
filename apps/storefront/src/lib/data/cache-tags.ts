/**
 * Stable, catalog-wide cache tags. Unlike the per-visitor `getCacheOptions` in
 * `cookies.ts`, these are NOT suffixed with `_medusa_cache_id`, so the backend
 * can name and invalidate them from a webhook (see
 * `src/app/api/revalidate/route.ts`). Only use these for non-personalized
 * catalog data — never for cart/order/customer.
 *
 * This module is intentionally free of `server-only` / `next/headers` so it can
 * be imported by catalog data files that also end up in client bundles.
 */
export const CACHE_TAGS = {
  products: 'products',
  product: (handle: string) => `product-${handle}`,
  offers: 'offers',
  offer: (id: string) => `offer-${id}`,
  productOffers: (productId: string) => `product-offers-${productId}`,
  collections: 'collections',
  collection: (handle: string) => `collection-${handle}`,
  categories: 'categories',
  category: (handle: string) => `category-${handle}`,
} as const;

/**
 * Heavy, indefinite caching: `revalidate: false` caches the fetch forever, with
 * the ONLY invalidation path being a `revalidateTag` on one of these tags
 * (pushed from the backend webhook). No time-based revalidation.
 */
export const getGlobalCacheOptions = (
  base: string,
  scoped?: string
): { revalidate: false; tags: string[] } => {
  const tags = scoped ? [base, scoped] : [base];
  return { revalidate: false, tags };
};
