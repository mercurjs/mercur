import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"
import { isPayoutReady } from "../utils/account-ready"

const PROCESSABLE = [PayoutStatus.PENDING, PayoutStatus.FAILED, PayoutStatus.ON_HOLD, PayoutStatus.PROCESSING]

export const processAdjustmentsStepId = "process-stripe-adjustments"

/**
 * Sends pending adjustments, retries failed or held ones whose account is
 * ready, and resends the ones a previous run left without an outcome.
 */
export const processAdjustmentsStep = createStep(processAdjustmentsStepId, async (_, { container }) => {
  const connector = resolveConnector(container)
  if (!connector.getOptions().settlements.enabled) {
    return new StepResponse(0)
  }
  const adjustments = await connector.listAdjustments({ status: PROCESSABLE }, { take: null })
  const accountIds = Array.from(new Set(adjustments.map((a) => a.account_id)))
  const accounts = accountIds.length
    ? await resolvePayoutModule(container).listPayoutAccounts({ id: accountIds }, { take: null })
    : []
  const accountById = new Map(accounts.map((account) => [account.id, account]))

  let processed = 0
  for (const adjustment of adjustments) {
    const account = accountById.get(adjustment.account_id)
    if (!isPayoutReady(account)) {
      if (adjustment.status === PayoutStatus.PENDING || adjustment.status === PayoutStatus.FAILED) {
        await connector.updateAdjustments({
          id: adjustment.id,
          status: PayoutStatus.ON_HOLD,
          status_reason: "Payout account is not ready",
        })
      }
      continue
    }
    await connector.processAdjustment(adjustment.id, account.external_id as string)
    processed += 1
  }

  // Money that left through Stripe cannot be pulled back, so there is no compensation.
  return new StepResponse(processed)
})
