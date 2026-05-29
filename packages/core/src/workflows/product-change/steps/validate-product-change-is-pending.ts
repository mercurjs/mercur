import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ProductChangeStatus } from "@mercurjs/types"

export const validateProductChangeIsPendingStepId =
  "pc-validate-product-change-is-pending"

type ValidateProductChangeIsPendingStepInput = {
  change: { id: string; status: ProductChangeStatus | string }
}

export const validateProductChangeIsPendingStep = createStep(
  validateProductChangeIsPendingStepId,
  async ({ change }: ValidateProductChangeIsPendingStepInput) => {
    if (change.status !== ProductChangeStatus.PENDING) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Product change '${change.id}' has status '${change.status}', expected '${ProductChangeStatus.PENDING}'.`,
      )
    }
    return new StepResponse(void 0)
  },
)
