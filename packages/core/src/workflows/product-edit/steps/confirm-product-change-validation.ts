import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ProductChangeStatus } from "@mercurjs/types"

export const confirmProductChangeValidationStepId =
  "pc-confirm-product-change-validation"

type ConfirmProductChangeValidationStepInput = {
  changes: Array<{
    id: string
    status: ProductChangeStatus | string
  }>
  expected_ids: string[]
}

/**
 * Composite of "row exists" + "status is PENDING". The "row not stale"
 * check (concurrent confirm guard) is left to the database transaction.
 */
export const confirmProductChangeValidationStep = createStep(
  confirmProductChangeValidationStepId,
  async ({
    changes,
    expected_ids,
  }: ConfirmProductChangeValidationStepInput) => {
    const found = new Set(changes.map((c) => c.id))
    const missing = expected_ids.filter((id) => !found.has(id))

    if (missing.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product change(s) not found: ${missing.join(", ")}`,
      )
    }

    for (const change of changes) {
      if (change.status !== ProductChangeStatus.PENDING) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot confirm product change '${change.id}' with status '${change.status}'. Only pending changes can be confirmed.`,
        )
      }
    }

    return new StepResponse(void 0)
  },
)
