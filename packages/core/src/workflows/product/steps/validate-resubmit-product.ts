import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validateResubmitProductStep = createStep(
  "validate-resubmit-product",
  async ({ product }: { product: any }) => {
    if (product.status !== ProductStatus.REQUIRES_ACTION) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot resubmit product with status '${product.status}'. Only products with requires_action status can be resubmitted.`
      )
    }
  }
)
