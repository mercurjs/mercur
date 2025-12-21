import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import sellerProductLink from "../../../links/seller-product";

export const filterVariantsBySellerStep = createStep(
  "filter-variants-by-seller",
  async (input: { sellerId: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: sellerProducts } = await query.graph({
      entity: sellerProductLink.entryPoint,
      fields: ["product_id"],
      filters: {
        seller_id: input.sellerId,
        deleted_at: {
          $eq: null,
        },
      },
    });

    const productIds = (sellerProducts as any[]).map((sp) => sp.product_id);

    if (productIds.length === 0) {
      return new StepResponse({
        variantIds: [],
      });
    }

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id"],
      filters: {
        product_id: productIds,
      },
    });

    const variantIds = (variants as any[]).map((v) => v.id);

    return new StepResponse({
      variantIds,
    });
  }
);
