import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validateActivateProductStep = createStep(
  "validate-activate-product",
  async ({ product }: { product: any }) => {
    if (product.status !== ProductStatus.ACCEPTED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot activate product with status '${product.status}'. Only accepted products can be activated.`
      )
    }
  }
)
