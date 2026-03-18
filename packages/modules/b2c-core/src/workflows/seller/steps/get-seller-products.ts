import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import sellerProduct from '../../../links/seller-product';

export const exportProductFields = [
  'id',
  'title',
  'subtitle',
  'status',
  'external_id',
  'description',
  'handle',
  'is_giftcard',
  'discountable',
  'thumbnail',
  'collection_id',
  'type_id',
  'weight',
  'length',
  'height',
  'width',
  'hs_code',
  'origin_country',
  'mid_code',
  'material',
  'metadata',
  'type',
  'collection',
  'options.*',
  'options.values',
  'tags.*',
  'images.*',
  'variants.*',
  'variants.prices',
  'variants.prices.price_rules.value',
  'variants.prices.price_rules.attribute',
  'variants.options.*'
];

type GetSellerProductsInput = {
  seller_id: string;
  product_ids?: string[];
};

export const getSellerProductsStep = createStep(
  'get-seller-products',
  async (input: GetSellerProductsInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const filters: Record<string, unknown> = {
      seller_id: input.seller_id
    };

    if (input.product_ids) {
      filters.product_id = input.product_ids;
    }

    const { data: products } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: exportProductFields.map((field) => `product.${field}`),
      filters
    });

    return new StepResponse(products.map((rel) => rel.product));
  }
);
