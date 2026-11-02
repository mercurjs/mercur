import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

export type ValidateSettlementPayoutRetryStepInput = {
  settlement: {
    id: string
    payout_status: PayoutStatus | null
    provider_payout_id: string | null
    payout_account?: { id: string; external_id: string | null; payouts_enabled: boolean } | null
  }
}

const RETRIABLE = [PayoutStatus.PENDING, PayoutStatus.FAILED, PayoutStatus.ON_HOLD]

export const validateSettlementPayoutRetryStepId = "validate-stripe-settlement-payout-retry"

export const validateSettlementPayoutRetryStep = createStep(
  validateSettlementPayoutRetryStepId,
  async ({ settlement }: ValidateSettlementPayoutRetryStepInput) => {
    const status = settlement.payout_status
    const retriable =
      !!status &&
      (RETRIABLE.includes(status) || (status === PayoutStatus.PROCESSING && !settlement.provider_payout_id))
    if (!retriable) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Settlement ${settlement.id} has no failed or held payout to retry`
      )
    }

    const account = settlement.payout_account
    if (!account?.payouts_enabled || !account.external_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Payout account ${account?.id ?? "unknown"} cannot receive payouts yet`
      )
    }

    return new StepResponse(void 0)
  }
)
