import { BigNumberInput } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import { PayoutStatus, PayoutStatusReason } from "@mercurjs/types"

import { SettlementLineType, SettlementStatus } from "../../../types/common"

export type SettlementSourceLine = {
  id: string
  type: SettlementLineType
  amount: BigNumberInput
  paid_at: Date | string
  landed_amount?: number | null
  landed_currency?: string | null
}

export type SettlementTotals = {
  payouts_total: BigNumberInput
  reversals_total: BigNumberInput
  adjustments_total: BigNumberInput
  amount: BigNumberInput
  payout_amount: BigNumberInput | null
  payout_currency_code: string | null
  lines: SettlementSourceLine[]
  status: SettlementStatus
  payout_status: PayoutStatus | null
  payout_reason: string | null
}

const SIGN: Record<SettlementLineType, 1 | -1> = {
  [SettlementLineType.PAYOUT]: 1,
  [SettlementLineType.REVERSAL]: -1,
  [SettlementLineType.ADJUSTMENT_CREDIT]: 1,
  [SettlementLineType.ADJUSTMENT_DEBIT]: -1,
}

/**
 * The bank payout, in what the lines actually added to the connected balance.
 * Stripe converts transfers into a currency the account holds, so it can
 * differ from the settlement currency. Without a landed amount on every line,
 * or with more than one landed currency, it stays in the settlement currency.
 */
function landedPayout(lines: SettlementSourceLine[]): { payout_amount: BigNumberInput | null; payout_currency_code: string | null } {
  const currencies = new Set(lines.map((line) => (line.landed_amount == null ? null : line.landed_currency ?? null)))
  const [currency] = currencies
  if (!lines.length || currencies.size !== 1 || !currency) {
    return { payout_amount: null, payout_currency_code: null }
  }
  const sum = lines.reduce<BigNumberInput>(
    (acc, line) => MathBN.add(acc, MathBN.mult(line.landed_amount as number, SIGN[line.type])),
    0
  )
  return MathBN.gt(sum, 0) ? { payout_amount: sum, payout_currency_code: currency } : { payout_amount: null, payout_currency_code: null }
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
    ...landedPayout(included),
    lines: included,
  }

  if (MathBN.lte(amount, 0)) {
    return {
      ...totals,
      status: SettlementStatus.ABORTED,
      payout_status: null,
      payout_reason: PayoutStatusReason.INVALID_AMOUNT,
    }
  }

  if (!account || !account.payouts_enabled) {
    return {
      ...totals,
      status: SettlementStatus.OPEN,
      payout_status: PayoutStatus.ON_HOLD,
      payout_reason: account
        ? PayoutStatusReason.ACCOUNT_PAYOUTS_DISABLED
        : PayoutStatusReason.ACCOUNT_NOT_READY,
    }
  }

  return { ...totals, status: SettlementStatus.OPEN, payout_status: PayoutStatus.PENDING, payout_reason: null }
}
