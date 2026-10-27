import { BigNumberInput } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import { PayoutStatus, PayoutStatusReason, formatStatusReason } from "@mercurjs/types"

import { SettlementLineType, SettlementStatus } from "../types/common"

export type SettlementSourceLine = {
  id: string
  type: SettlementLineType
  amount: BigNumberInput
  paid_at: Date | string
}

export type SettlementTotals = {
  payouts_total: BigNumberInput
  reversals_total: BigNumberInput
  adjustments_total: BigNumberInput
  amount: BigNumberInput
  lines: SettlementSourceLine[]
  status: SettlementStatus
  payout_status: PayoutStatus | null
  payout_reason: string | null
}

/**
 * Nets every paid line not settled yet, up to the end of the window: payouts
 * and credits count up, reversals and debits count down. A non-positive
 * amount aborts the settlement so the chain of windows stays unbroken.
 */
export function buildSettlement(
  lines: SettlementSourceLine[],
  periodEnd: Date,
  account: { payouts_enabled: boolean; seller_id: string } | null
): SettlementTotals {
  let payouts: BigNumberInput = 0
  let reversals: BigNumberInput = 0
  let adjustments: BigNumberInput = 0
  const included: SettlementSourceLine[] = []

  for (const line of lines) {
    if (new Date(line.paid_at).getTime() > periodEnd.getTime()) {
      continue
    }
    included.push(line)
    switch (line.type) {
      case SettlementLineType.PAYOUT:
        payouts = MathBN.add(payouts, line.amount)
        break
      case SettlementLineType.REVERSAL:
        reversals = MathBN.add(reversals, line.amount)
        break
      case SettlementLineType.ADJUSTMENT_CREDIT:
        adjustments = MathBN.add(adjustments, line.amount)
        break
      case SettlementLineType.ADJUSTMENT_DEBIT:
        adjustments = MathBN.sub(adjustments, line.amount)
        break
    }
  }

  const amount = MathBN.add(MathBN.sub(payouts, reversals), adjustments)
  const totals = {
    payouts_total: payouts,
    reversals_total: reversals,
    adjustments_total: adjustments,
    amount,
    lines: included,
  }

  if (MathBN.lte(amount, 0)) {
    return {
      ...totals,
      status: SettlementStatus.ABORTED,
      payout_status: null,
      payout_reason: formatStatusReason(PayoutStatusReason.INVALID_AMOUNT, MathBN.convert(amount).toString()),
    }
  }

  if (!account || !account.payouts_enabled) {
    return {
      ...totals,
      status: SettlementStatus.OPEN,
      payout_status: PayoutStatus.ON_HOLD,
      payout_reason: account
        ? formatStatusReason(PayoutStatusReason.ACCOUNT_PAYOUTS_DISABLED, account.seller_id)
        : formatStatusReason(PayoutStatusReason.ACCOUNT_NOT_READY, "unknown"),
    }
  }

  return { ...totals, status: SettlementStatus.OPEN, payout_status: PayoutStatus.PENDING, payout_reason: null }
}
