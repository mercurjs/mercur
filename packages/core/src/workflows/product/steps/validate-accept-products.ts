import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validateAcceptProductsStep = createStep(
  "validate-accept-products",
  async ({ products }: { products: any[] }) => {
    for (const product of products) {
      if (product.status !== ProductStatus.PROPOSED) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot accept product '${product.id}' with status '${product.status}'. Only proposed products can be accepted.`
        )
      }

      if (!product.product_change) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Product '${product.id}' has no active change to accept`
        )
      }
    }
  }
)
