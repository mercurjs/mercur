import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ProductChangeStatus } from "@mercurjs/types"

export const validateProductChangeIsRequiresActionStepId =
  "pc-validate-product-change-is-requires-action"

type ValidateProductChangeIsRequiresActionStepInput = {
  change: { id: string; status: ProductChangeStatus | string }
}

export const validateProductChangeIsRequiresActionStep = createStep(
  validateProductChangeIsRequiresActionStepId,
  async ({ change }: ValidateProductChangeIsRequiresActionStepInput) => {
    if (change.status !== ProductChangeStatus.REQUIRES_ACTION) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Product change '${change.id}' has status '${change.status}', expected '${ProductChangeStatus.REQUIRES_ACTION}'.`,
      )
    }
    return new StepResponse(void 0)
  },
)
