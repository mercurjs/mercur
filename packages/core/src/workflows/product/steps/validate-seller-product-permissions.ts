import { Query } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ValidateSellerProductPermissionsInput = {
  seller_id: string
  category_ids?: string[]
}

export const validateSellerProductPermissionsStep = createStep(
  "validate-seller-product-permissions",
  async (
    {
      seller_id,
      category_ids,
    }: ValidateSellerProductPermissionsInput,
    { container }
  ) => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)

    // Category restriction (blacklist): if a category-seller link exists for
    // (category_id, seller_id), the seller is BLOCKED from that category.
    if (category_ids && category_ids.length > 0) {
      const uniqueCategoryIds = [...new Set(category_ids)]

      const { data: categories } = await query.graph({
        entity: "product_category",
        fields: ["id", "sellers.id"],
        filters: { id: uniqueCategoryIds },
      })

      const blockedIds = categories
        .filter((c) =>
          (c.sellers ?? []).some((s) => s.id === seller_id)
        )
        .map((c) => c.id)

      if (blockedIds.length > 0) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Seller is restricted from categories: ${blockedIds.join(", ")}`
        )
      }
    }

    return new StepResponse(void 0)
  }
)
