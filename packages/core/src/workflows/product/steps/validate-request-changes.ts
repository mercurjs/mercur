import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validateRequestChangesStep = createStep(
  "validate-request-changes",
  async ({ product, rejection_reason_ids }: { product: any; rejection_reason_ids: string[] }) => {
    if (product.status !== ProductStatus.PENDING) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot request changes for product with status '${product.status}'. Only pending products can have changes requested.`
      )
    }

    if (!product.product_change) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Product has no active change"
      )
    }

    if (!rejection_reason_ids || rejection_reason_ids.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "At least one reason is required when requesting changes"
      )
    }
  }
)
