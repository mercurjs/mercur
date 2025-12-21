import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import sellerProductLink from "../../../links/seller-product";

interface SellerProduct {
  product_id: string;
}

export interface GetSellerProductIdsInput {
  seller_id?: string;
}

export const getSellerProductIdsStep = createStep(
  "get-seller-product-ids",
  async (input: GetSellerProductIdsInput, { container }) => {
    if (!input.seller_id) {
      return new StepResponse([]);
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: sellerProducts } = await query.graph({
      entity: sellerProductLink.entryPoint,
      fields: ["product_id"],
      filters: {
        seller_id: input.seller_id,
        deleted_at: {
          $eq: null,
        },
      },
    });

    const productIds = (sellerProducts as SellerProduct[]).map(
      (sp) => sp.product_id
    );

    return new StepResponse(productIds);
  }
);
