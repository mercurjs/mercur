import { z } from 'zod';

import { PriceListCreateProductsSchema } from "../../../../common/schemas"

const PriceListPricesAddBaseSchema = z.object({
  product_ids: z.array(z.object({ id: z.string() })).min(1),
  products: PriceListCreateProductsSchema
});

export const PriceListPricesAddProductIdsSchema = PriceListPricesAddBaseSchema.pick({
  product_ids: true
});

export const PriceListPricesAddProductsIdsFields = Object.keys(
  PriceListPricesAddProductIdsSchema.shape
) as (keyof typeof PriceListPricesAddProductIdsSchema.shape)[];

export const PriceListPricesAddProductsSchema = PriceListPricesAddBaseSchema.pick({
  products: true
});

export const PriceListPricesAddProductsFields = Object.keys(
  PriceListPricesAddProductsSchema.shape
) as (keyof typeof PriceListPricesAddProductsSchema.shape)[];

export const PriceListPricesAddSchema = PriceListPricesAddBaseSchema.refine(
  data => {
    // Check if at least one product has at least one price with an amount
    const productIds = data.product_ids.map(p => p.id);

    for (const productId of productIds) {
      const product = data.products[productId];
      if (!product) continue;

      // Check all variants of this product
      for (const variant of Object.values(product.variants || {})) {
        // Check currency prices
        const hasCurrencyPrice = Object.values(variant.currency_prices || {}).some(price => {
          const amount = price?.amount;
          return (
            amount !== undefined &&
            amount !== null &&
            amount !== '' &&
            (typeof amount === 'number' ? amount > 0 : String(amount).trim() !== '')
          );
        });

        // Check region prices
        const hasRegionPrice = Object.values(variant.region_prices || {}).some(price => {
          const amount = price?.amount;
          return (
            amount !== undefined &&
            amount !== null &&
            amount !== '' &&
            (typeof amount === 'number' ? amount > 0 : String(amount).trim() !== '')
          );
        });

        if (hasCurrencyPrice || hasRegionPrice) {
          return true;
        }
      }
    }

    return false;
  },
  {
    message: 'At least one price must be added.',
    path: ['products']
  }
);

export type PriceListPricesAddSchema = z.infer<typeof PriceListPricesAddSchema>;
