import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

export const validateRequestChangesStep = createStep(
  "validate-request-changes",
  async ({ product }: { product: any }) => {
    if (product.status !== ProductStatus.PROPOSED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot request changes for product with status '${product.status}'. Only proposed products can have changes requested.`
      )
    }
  }
)
