import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validatePublishProductsStep = createStep(
  "validate-publish-products",
  async ({ products }: { products: any[] }) => {
    for (const product of products) {
      if (product.status !== ProductStatus.PROPOSED) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot publish product '${product.id}' with status '${product.status}'. Only proposed products can be published.`
        )
      }
    }
  }
)
