import { MedusaContainer } from "@medusajs/framework/types"
import { PayoutStatus } from "@mercurjs/types"

import { AdjustmentType, SettlementLineType } from "../../../types/common"
import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"
import { SettlementSourceLine } from "./settlement-builder"

export type UnsettledLine = SettlementSourceLine & { currency_code: string }

/** Paid payouts, reversals and adjustments of an account that no settlement holds yet. */
export async function unsettledLines(container: MedusaContainer, accountId: string): Promise<UnsettledLine[]> {
  const payoutModule = resolvePayoutModule(container)
  const connector = resolveConnector(container)

  const accountPayouts = await payoutModule.listPayouts(
    { account_id: accountId },
    { take: null, select: ["id", "amount", "currency_code", "status", "updated_at"] }
  )
  const currencyByPayout = new Map(accountPayouts.map((p) => [p.id, p.currency_code]))
  const paidPayouts = accountPayouts.filter((p) => p.status === PayoutStatus.PAID)

  const reversals = accountPayouts.length
    ? await payoutModule.listPayoutReversals(
        { payout_id: accountPayouts.map((p) => p.id), status: PayoutStatus.PAID },
        { take: null, select: ["id", "payout_id", "amount", "updated_at"] }
      )
    : []
  const adjustments = await connector.listAdjustments(
    { account_id: accountId, status: PayoutStatus.PAID },
    { take: null }
  )

  const [settledPayouts, settledReversals, settledAdjustments] = await Promise.all([
    paidPayouts.length
      ? connector.listSettlementLines({ payout_id: paidPayouts.map((p) => p.id) }, { take: null, select: ["payout_id"] })
      : [],
    reversals.length
      ? connector.listSettlementLines(
          { payout_reversal_id: reversals.map((r) => r.id) },
          { take: null, select: ["payout_reversal_id"] }
        )
      : [],
    adjustments.length
      ? connector.listSettlementLines(
          { adjustment_id: adjustments.map((a) => a.id) },
          { take: null, select: ["adjustment_id"] }
        )
      : [],
  ])
  const settled = new Set(
    [
      ...settledPayouts.map((l) => l.payout_id),
      ...settledReversals.map((l) => l.payout_reversal_id),
      ...settledAdjustments.map((l) => l.adjustment_id),
    ].filter((id): id is string => !!id)
  )

  return [
    ...paidPayouts.map((p) => ({
      id: p.id,
      type: SettlementLineType.PAYOUT,
      amount: p.amount,
      paid_at: p.updated_at,
      currency_code: p.currency_code,
    })),
    ...reversals.map((r) => ({
      id: r.id,
      type: SettlementLineType.REVERSAL,
      amount: r.amount,
      paid_at: r.updated_at,
      currency_code: currencyByPayout.get(r.payout_id) as string,
    })),
    ...adjustments.map((a) => ({
      id: a.id,
      type: a.type === AdjustmentType.EXTRA_CREDIT ? SettlementLineType.ADJUSTMENT_CREDIT : SettlementLineType.ADJUSTMENT_DEBIT,
      amount: a.amount,
      paid_at: a.updated_at,
      currency_code: a.currency_code,
    })),
  ].filter((line) => !settled.has(line.id))
}

/** The typed reference a settlement line keeps to the row it nets. */
export const lineReference = (line: SettlementSourceLine) => {
  switch (line.type) {
    case SettlementLineType.PAYOUT:
      return { payout_id: line.id }
    case SettlementLineType.REVERSAL:
      return { payout_reversal_id: line.id }
    default:
      return { adjustment_id: line.id }
  }
}
