import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"
import { isPayoutReady } from "../utils/account-ready"

export const retrySettlementPayoutsStepId = "retry-stripe-settlement-payouts"

/** Sends the bank payouts of settlements that failed or were held, once their account is ready. */
export const retrySettlementPayoutsStep = createStep(
  retrySettlementPayoutsStepId,
  async (input: { account_ids: string[] | null }, { container }) => {
    const connector = resolveConnector(container)
    const { settlements } = connector.getOptions()
    if (!settlements.enabled || settlements.mode !== "connector") {
      return new StepResponse(0)
    }

    const backlog = await connector.listSettlements(
      {
        payout_status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD],
        ...(input.account_ids ? { account_id: input.account_ids } : {}),
      },
      { take: null }
    )
    const accountIds = Array.from(new Set(backlog.map((s) => s.account_id)))
    const accounts = accountIds.length
      ? await resolvePayoutModule(container).listPayoutAccounts({ id: accountIds }, { take: null })
      : []
    const accountById = new Map(accounts.map((account) => [account.id, account]))

    let retried = 0
    for (const settlement of backlog) {
      const account = accountById.get(settlement.account_id)
      if (!isPayoutReady(account)) {
        continue
      }
      await connector.dispatchSettlementPayout(settlement.id, account.external_id as string)
      retried += 1
    }

    return new StepResponse(retried)
  }
)
