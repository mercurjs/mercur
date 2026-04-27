import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validateRejectProductStep = createStep(
  "validate-reject-product",
  async ({ product, rejection_reason_ids }: { product: any; rejection_reason_ids: string[] }) => {
    if (product.status !== ProductStatus.PROPOSED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot reject product with status '${product.status}'. Only proposed products can be rejected.`
      )
    }

    if (!product.product_change) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Product has no active change to reject"
      )
    }

    if (!rejection_reason_ids || rejection_reason_ids.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "At least one rejection reason is required"
      )
    }
  }
)
