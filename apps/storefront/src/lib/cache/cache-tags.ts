export const CACHE_TAGS = {
  products: 'products',
  categories: 'categories',
  collections: 'collections',
  regions: 'regions',
  sellers: 'sellers',
  paymentProviders: 'payment_providers'
} as const;

export const productTag = (handle: string) => `product-${handle}`;
export const categoryTag = (handle: string) => `category-${handle}`;
export const collectionTag = (handle: string) => `collection-${handle}`;
export const regionTag = (id: string) => `region-${id}`;
export const sellerTag = (handle: string) => `seller-${handle}`;
