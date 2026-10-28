import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"
import { isPayoutReady } from "../utils/account-ready"

const RETRIABLE = [PayoutStatus.PENDING, PayoutStatus.FAILED, PayoutStatus.ON_HOLD]

export const dispatchAdjustmentsStepId = "dispatch-stripe-adjustments"

/** Sends pending adjustments, and retries failed or held ones whose account is ready. */
export const dispatchAdjustmentsStep = createStep(dispatchAdjustmentsStepId, async (_, { container }) => {
  const connector = resolveConnector(container)
  if (!connector.getOptions().settlements.enabled) {
    return new StepResponse(0)
  }
  const adjustments = await connector.listAdjustments({ status: RETRIABLE }, { take: null })
  const accountIds = Array.from(new Set(adjustments.map((a) => a.account_id)))
  const accounts = accountIds.length
    ? await resolvePayoutModule(container).listPayoutAccounts({ id: accountIds }, { take: null })
    : []
  const accountById = new Map(accounts.map((account) => [account.id, account]))

  let dispatched = 0
  for (const adjustment of adjustments) {
    const account = accountById.get(adjustment.account_id)
    if (!isPayoutReady(account)) {
      if (adjustment.status !== PayoutStatus.ON_HOLD) {
        await connector.updateAdjustments({
          id: adjustment.id,
          status: PayoutStatus.ON_HOLD,
          status_reason: "Payout account is not ready",
        })
      }
      continue
    }
    await connector.dispatchAdjustment(adjustment.id, account.external_id as string)
    dispatched += 1
  }

  return new StepResponse(dispatched)
})
