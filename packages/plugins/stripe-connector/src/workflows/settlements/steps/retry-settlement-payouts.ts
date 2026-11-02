import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"
import { isPayoutReady } from "../utils/account-ready"
import { isSettlementPayoutUnpaid } from "../utils/settlement-payout"

export const retrySettlementPayoutsStepId = "retry-stripe-settlement-payouts"

/**
 * Sends the bank payouts of settlements that failed, were held (account not
 * ready, balance short), or were left without an outcome, once their account
 * is ready.
 */
export const retrySettlementPayoutsStep = createStep(
  retrySettlementPayoutsStepId,
  async (input: { account_ids: string[] | null }, { container }) => {
    const connector = resolveConnector(container)
    const { settlements } = connector.getOptions()
    if (!settlements.enabled || settlements.mode !== "plugin") {
      return new StepResponse({ sent: 0, failed_ids: [] as string[] })
    }

    const scope = input.account_ids ? { account_id: input.account_ids } : {}
    const backlog = await connector.listSettlements(
      {
        $or: [
          { payout_status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD] },
          { payout_status: PayoutStatus.PROCESSING, provider_payout_id: null },
        ],
        ...scope,
      },
      { take: null }
    )
    const accountIds = Array.from(new Set(backlog.map((s) => s.account_id)))
    const accounts = accountIds.length
      ? await resolvePayoutModule(container).listPayoutAccounts({ id: accountIds }, { take: null })
      : []
    const accountById = new Map(accounts.map((account) => [account.id, account]))

    let retried = 0
    const failedIds: string[] = []
    for (const settlement of backlog) {
      const account = accountById.get(settlement.account_id)
      if (!isPayoutReady(account)) {
        continue
      }
      const updated = await connector.createSettlementPayout(settlement.id, account.external_id as string)
      retried += 1
      if (isSettlementPayoutUnpaid(updated)) {
        failedIds.push(updated.id)
      }
    }

    // A bank payout Stripe accepted cannot be pulled back, so there is no compensation.
    return new StepResponse({ sent: retried, failed_ids: failedIds })
  }
)
