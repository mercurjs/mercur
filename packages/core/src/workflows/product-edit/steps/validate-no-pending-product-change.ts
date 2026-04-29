import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

type ValidateNoPendingProductChangeStepInput = {
  product: any
}

/**
 * Guards every action-staging workflow: a product can carry only one
 * pending `ProductChange` at a time. The flow is sequential — each edit
 * (`product-edit-update-fields`, `product-edit-add-variant`, etc.) opens
 * its own change, and the next edit must wait until the current one is
 * confirmed, declined, or canceled.
 */
export const validateNoPendingProductChangeStep = createStep(
  "validate-no-pending-product-change",
  async ({ product }: ValidateNoPendingProductChangeStepInput) => {
    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Product not found"
      )
    }

    if (product.product_change) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Product '${product.id}' already has a pending change '${product.product_change.id}'. Confirm, decline, or cancel it before staging another edit.`
      )
    }
  }
)
