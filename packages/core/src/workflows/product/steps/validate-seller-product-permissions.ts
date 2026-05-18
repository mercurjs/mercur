import { Query } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ValidateSellerProductPermissionsInput = {
  seller_id: string
  category_ids?: string[]
  brand_ids?: string[]
}

export const validateSellerProductPermissionsStep = createStep(
  "validate-seller-product-permissions",
  async (
    {
      seller_id,
      category_ids,
      brand_ids,
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

    // Brand restriction (whitelist): only enforced when `brand.is_restricted`
    // is true; in that case the seller must appear in the brand's sellers.
    if (brand_ids && brand_ids.length > 0) {
      const uniqueBrandIds = [...new Set(brand_ids)]

      const { data: brands } = await query.graph({
        entity: "product_brand",
        fields: ["id", "is_restricted", "sellers.id"],
        filters: { id: uniqueBrandIds },
      })

      for (const brand of brands) {
        if (!brand.is_restricted) {
          continue
        }

        const isAuthorized = (brand.sellers ?? []).some(
          (s) => s.id === seller_id
        )

        if (!isAuthorized) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            `Seller is not authorized to use restricted brand '${brand.id}'`
          )
        }
      }
    }

    return new StepResponse(void 0)
  }
)
