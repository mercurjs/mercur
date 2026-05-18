import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validateRejectProductStep = createStep(
  "validate-reject-product",
  async ({ product }: { product: any }) => {
    if (product.status !== ProductStatus.PROPOSED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot reject product with status '${product.status}'. Only proposed products can be rejected.`
      )
    }
  }
)
