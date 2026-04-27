import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validateActivateProductStep = createStep(
  "validate-activate-product",
  async ({ product }: { product: any }) => {
    if (product.status !== ProductStatus.PUBLISHED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot activate product with status '${product.status}'. Only published products can be activated.`
      )
    }
  }
)
