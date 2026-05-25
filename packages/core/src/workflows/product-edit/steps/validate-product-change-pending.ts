import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductChangeStatus } from "@mercurjs/types"

type ValidateProductChangePendingStepInput = {
  product_change: any
}

/**
 * Generic guard: action staging and lifecycle transitions (cancel, decline,
 * confirm) all require the change to be in `PENDING` status. Mirrors
 * Medusa's `throwIfOrderChangeIsNotActive` utility used across order-edit
 * workflows.
 */
export const validateProductChangePendingStep = createStep(
  "validate-product-change-pending",
  async ({ product_change }: ValidateProductChangePendingStepInput) => {
    if (!product_change) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Product change not found"
      )
    }

    if (product_change.status !== ProductChangeStatus.PENDING) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Product change '${product_change.id}' is not active (status='${product_change.status}'). Only pending changes can be modified.`
      )
    }
  }
)
