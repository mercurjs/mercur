import { PayoutStatus } from "@mercurjs/types"

import { SettlementLineType, SettlementStatus } from "../../../types/common"
import { SettlementSourceLine, buildSettlement } from "./settlement-builder"

export type UnsettledLine = SettlementSourceLine & { currency_code: string }

export type PreviousSettlement = {
  currency_code: string
  period_start: Date | string
  period_end: Date | string
  status: SettlementStatus
  payout_status: PayoutStatus | null
  provider_payout_id: string | null
}

export type SettlementSource = {
  account: {
    id: string
    external_id: string | null
    payouts_enabled: boolean
    created_at: Date | string
  }
  seller_id: string | null
  previous: PreviousSettlement[]
  lines: UnsettledLine[]
}

export type PlannedSettlement = {
  account_id: string
  external_id: string | null
  seller_id: string | null
  currency_code: string
  period_start: Date
  period_end: Date
  payouts_total: number
  reversals_total: number
  adjustments_total: number
  amount: number
  payout_amount: number | null
  payout_currency_code: string | null
  status: SettlementStatus
  payout_status: PayoutStatus | null
  status_reason: string | null
  lines: {
    type: SettlementLineType
    amount: number
    payout_id: string | null
    payout_reversal_id: string | null
    adjustment_id: string | null
  }[]
}

export type SettlementPlan = {
  settlements: PlannedSettlement[]
  counts: Record<string, number>
}

export const lineReference = (line: SettlementSourceLine) => ({
  payout_id: line.type === SettlementLineType.PAYOUT ? line.id : null,
  payout_reversal_id: line.type === SettlementLineType.REVERSAL ? line.id : null,
  adjustment_id:
    line.type === SettlementLineType.ADJUSTMENT_CREDIT || line.type === SettlementLineType.ADJUSTMENT_DEBIT
      ? line.id
      : null,
})

// A bank payout the provider already accepted no longer holds the chain; one
// that still has to be sent (or whose outcome is unknown) does.
const holdsChain = (previous: PreviousSettlement) =>
  previous.status === SettlementStatus.FAILED ||
  (previous.status === SettlementStatus.OPEN &&
    !(
      previous.payout_status === PayoutStatus.PAID ||
      previous.payout_status === PayoutStatus.ABORTED ||
      (previous.payout_status === PayoutStatus.PROCESSING && !!previous.provider_payout_id)
    ))

export const latestByCurrency = (settlements: PreviousSettlement[]) => {
  const latest = new Map<string, PreviousSettlement>()
  for (const settlement of settlements) {
    const current = latest.get(settlement.currency_code)
    if (!current || new Date(settlement.period_end).getTime() > new Date(current.period_end).getTime()) {
      latest.set(settlement.currency_code, settlement)
    }
  }
  return latest
}

/**
 * Where to start looking for unsettled lines: one window back from the oldest
 * latest settlement across currencies, so a line paid while that settlement
 * was being built is not missed. Null scans the whole history.
 */
export const unsettledSince = (settlements: PreviousSettlement[]): Date | null => {
  const starts = Array.from(latestByCurrency(settlements).values()).map((s) => new Date(s.period_start).getTime())
  return starts.length ? new Date(Math.min(...starts)) : null
}

/**
 * One settlement per account and currency over the window since the previous
 * one, netting every paid line not settled yet. A currency whose previous
 * settlement is still unpaid is blocked until it is.
 */
export function planSettlements(sources: SettlementSource[], now: Date, mode: "plugin" | "provider"): SettlementPlan {
  const counts: Record<string, number> = { settlements: 0, aborted: 0, on_hold: 0, blocked: 0 }
  const settlements: PlannedSettlement[] = []

  for (const source of sources) {
    const latest = latestByCurrency(source.previous)
    const currencies = Array.from(new Set(source.lines.map((line) => line.currency_code)))

    for (const currency of currencies) {
      const previous = latest.get(currency)
      if (previous && holdsChain(previous)) {
        counts.blocked += 1
        continue
      }

      const periodStart = new Date(previous ? previous.period_end : source.account.created_at)
      if (periodStart.getTime() >= now.getTime()) {
        continue
      }

      const totals = buildSettlement(
        source.lines.filter((line) => line.currency_code === currency),
        now,
        { payouts_enabled: source.account.payouts_enabled, seller_id: source.seller_id ?? source.account.id }
      )
      if (!totals.lines.length) {
        continue
      }

      const payoutStatus = mode === "provider" && totals.payout_status ? PayoutStatus.PAID : totals.payout_status
      const status =
        totals.status === SettlementStatus.ABORTED
          ? SettlementStatus.ABORTED
          : mode === "provider"
            ? SettlementStatus.PAID_OUT
            : payoutStatus === PayoutStatus.ON_HOLD
              ? SettlementStatus.FAILED
              : SettlementStatus.OPEN

      settlements.push({
        account_id: source.account.id,
        external_id: source.account.external_id,
        seller_id: source.seller_id,
        currency_code: currency,
        period_start: periodStart,
        period_end: now,
        payouts_total: Number(totals.payouts_total),
        reversals_total: Number(totals.reversals_total),
        adjustments_total: Number(totals.adjustments_total),
        amount: Number(totals.amount),
        payout_amount: totals.payout_amount == null ? null : Number(totals.payout_amount),
        payout_currency_code: totals.payout_currency_code,
        status,
        payout_status: payoutStatus,
        status_reason: totals.payout_reason,
        lines: totals.lines.map((line) => ({ type: line.type, amount: Number(line.amount), ...lineReference(line) })),
      })

      counts.settlements += 1
      if (status === SettlementStatus.ABORTED) counts.aborted += 1
      if (payoutStatus === PayoutStatus.ON_HOLD) counts.on_hold += 1
    }
  }

  return { settlements, counts }
}
