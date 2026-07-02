import { HttpTypes } from '@medusajs/types';
import type { SearchDoc } from '@mercurjs/types';

export const searchHitToProduct = (
  doc: SearchDoc
): HttpTypes.StoreProduct => {
  const price = doc.calculated_price
    ? {
        calculated_amount: doc.calculated_price.calculated_amount,
        original_amount: doc.calculated_price.original_amount,
        currency_code: doc.calculated_price.currency_code,
        calculated_price: { price_list_type: null }
      }
    : null;

  return {
    id: doc.id,
    title: doc.title,
    handle: doc.handle,
    thumbnail: doc.thumbnail,
    variants: [
      {
        id: doc.variant_id ?? doc.id,
        calculated_price: price
      }
    ]
  } as unknown as HttpTypes.StoreProduct;
};
