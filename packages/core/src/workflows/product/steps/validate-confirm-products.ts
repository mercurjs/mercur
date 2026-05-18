import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validateConfirmProductsStep = createStep(
  "validate-confirm-products",
  async ({ products }: { products: any[] }) => {
    for (const product of products) {
      if (product.status !== ProductStatus.PROPOSED) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot confirm product '${product.id}' with status '${product.status}'. Only proposed products can be confirmed.`
        )
      }
    }
  }
)
