import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

export type ValidatePayoutRetryStepInput = {
  payout: { id: string; status: PayoutStatus }
}

export const RETRYABLE_PAYOUT_STATUSES = [PayoutStatus.FAILED, PayoutStatus.ON_HOLD, PayoutStatus.PENDING]

export const validatePayoutRetryStepId = "validate-payout-retry"

export const validatePayoutRetryStep = createStep(
  validatePayoutRetryStepId,
  async ({ payout }: ValidatePayoutRetryStepInput) => {
    if (!RETRYABLE_PAYOUT_STATUSES.includes(payout.status)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Payout ${payout.id} is ${payout.status} and cannot be retried`
      )
    }

    return new StepResponse(void 0)
  }
)
