import { cacheLife } from 'next/cache';

/**
 * Stable, catalog-wide cache tags. Unlike the per-visitor `getCacheOptions` in
 * `cookies.ts`, these are NOT suffixed with `_medusa_cache_id`, so the backend
 * can name and invalidate them from a webhook (see
 * `src/app/api/revalidate/route.ts`). Only use these for non-personalized
 * catalog data — never for cart/order/customer.
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
  regions: 'regions',
  sellers: 'sellers',
  seller: (handle: string) => `seller-${handle}`,
} as const;

/**
 * Call inside a `"use cache"` read when the backend request failed. The
 * fallback still fits in the prerendered shell, so builds without a reachable
 * backend succeed, and it revalidates a minute later instead of living for the
 * read's normal lifetime.
 */
export const cacheFailedRead = () => {
  cacheLife('minutes');
};
