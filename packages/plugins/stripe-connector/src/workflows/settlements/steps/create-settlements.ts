import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { SettlementStatus } from "../../../types/common"
import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"
import { buildSettlement } from "../utils/settlement-builder"
import { lineReference, unsettledLines } from "../utils/unsettled-lines"

const SETTLED_PAYOUT = [PayoutStatus.PAID, PayoutStatus.PROCESSING, PayoutStatus.ABORTED]

export type CreatedSettlement = {
  id: string
  account_id: string
  external_id: string | null
  seller_id: string | null
  currency_code: string
  amount: number
  status: SettlementStatus
  payout_status: PayoutStatus | null
}

export type CreateSettlementsStepOutput = {
  settlements: CreatedSettlement[]
  counts: Record<string, number>
}

export const createSettlementsStepId = "create-stripe-settlements"

/**
 * One settlement per account and currency over the window since the
 * previous one, netting every paid line not settled yet.
 */
export const createSettlementsStep = createStep(
  createSettlementsStepId,
  async (input: { account_ids: string[] | null; now: Date }, { container }) => {
    const connector = resolveConnector(container)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const provider = connector.getOptions().settlements.mode === "provider"
    const now = new Date(Math.max(new Date(input.now).getTime(), Date.now()))
    const counts: Record<string, number> = { settlements: 0, aborted: 0, on_hold: 0, blocked: 0 }
    const created: CreatedSettlement[] = []

    if (!connector.getOptions().settlements.enabled) {
      return new StepResponse<CreateSettlementsStepOutput, string[]>({ settlements: [], counts }, [])
    }

    const accounts = await resolvePayoutModule(container).listPayoutAccounts(
      input.account_ids ? { id: input.account_ids } : {},
      { take: null }
    )
    const { data: sellerLinks } = accounts.length
      ? await query.graph({
          entity: "seller_payout_account",
          fields: ["seller_id", "payout_account_id"],
          filters: { payout_account_id: accounts.map((a) => a.id) },
        })
      : { data: [] }
    const sellerByAccount = new Map(sellerLinks.map((link) => [link.payout_account_id, link.seller_id]))

    for (const account of accounts) {
      const lines = await unsettledLines(container, account.id)
      const currencies = Array.from(new Set(lines.map((line) => line.currency_code)))

      for (const currency of currencies) {
        const [previous] = await connector.listSettlements(
          { account_id: account.id, currency_code: currency },
          { take: 1, order: { period_end: "DESC" } }
        )

        if (previous?.status === SettlementStatus.FAILED) {
          counts.blocked += 1
          continue
        }
        // A bank payout the provider already accepted no longer holds the
        // chain; only one that still has to be sent does.
        if (
          previous?.status === SettlementStatus.OPEN &&
          !(previous.payout_status && SETTLED_PAYOUT.includes(previous.payout_status))
        ) {
          counts.blocked += 1
          continue
        }

        const periodStart = previous ? new Date(previous.period_end) : new Date(account.created_at)
        if (periodStart.getTime() >= now.getTime()) {
          continue
        }

        const sellerId = sellerByAccount.get(account.id) ?? null
        const totals = buildSettlement(
          lines.filter((line) => line.currency_code === currency),
          now,
          { payouts_enabled: account.payouts_enabled, seller_id: sellerId ?? account.id }
        )
        if (!totals.lines.length) {
          continue
        }

        const payoutStatus = provider && totals.payout_status ? PayoutStatus.PAID : totals.payout_status
        const status =
          totals.status === SettlementStatus.ABORTED
            ? SettlementStatus.ABORTED
            : provider
              ? SettlementStatus.PAID_OUT
              : payoutStatus === PayoutStatus.ON_HOLD
                ? SettlementStatus.FAILED
                : SettlementStatus.OPEN

        const settlement = await connector.createSettlements({
          account_id: account.id,
          currency_code: currency,
          period_start: periodStart,
          period_end: now,
          payouts_total: Number(totals.payouts_total),
          reversals_total: Number(totals.reversals_total),
          adjustments_total: Number(totals.adjustments_total),
          amount: Number(totals.amount),
          status,
          payout_status: payoutStatus,
          status_reason: totals.payout_reason,
        })
        await connector.createSettlementLines(
          totals.lines.map((line) => ({
            settlement_id: settlement.id,
            type: line.type,
            amount: Number(line.amount),
            ...lineReference(line),
          }))
        )

        counts.settlements += 1
        if (status === SettlementStatus.ABORTED) counts.aborted += 1
        if (payoutStatus === PayoutStatus.ON_HOLD) counts.on_hold += 1

        created.push({
          id: settlement.id,
          account_id: account.id,
          external_id: account.external_id,
          seller_id: sellerId,
          currency_code: currency,
          amount: Number(settlement.amount),
          status,
          payout_status: payoutStatus,
        })
      }
    }

    return new StepResponse<CreateSettlementsStepOutput, string[]>(
      { settlements: created, counts },
      created.map((settlement) => settlement.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    await resolveConnector(container).deleteSettlements(ids)
  }
)
