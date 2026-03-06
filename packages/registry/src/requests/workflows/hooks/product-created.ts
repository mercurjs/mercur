import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { ProductStatus } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/framework/utils"

createProductsWorkflow.hooks.productsCreated(
  async ({ products }) => {
    for (const product of products) {
      if (product.status === ProductStatus.PUBLISHED) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product "${product.title}" cannot be created with status "published". Use "draft" or "requested" status and submit for review.`
        )
      }
    }

    return new StepResponse(undefined)
  }
)
