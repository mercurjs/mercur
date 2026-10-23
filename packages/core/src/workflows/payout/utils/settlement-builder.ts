import { BigNumberInput } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import {
  PayoutStatus,
  PayoutStatusReason,
  SettlementStatus,
  TransferStatus,
  TransferType,
  formatStatusReason,
} from "@mercurjs/types"

export type SettlementTransferLine = {
  id: string
  type: TransferType
  status: TransferStatus
  amount: BigNumberInput
  currency_code: string
  updated_at: Date | string
}

export type SettlementWindow = {
  period_start: Date
  period_end: Date
}

export type SettlementTotals = {
  transfers_total: BigNumberInput
  reversals_total: BigNumberInput
  adjustments_total: BigNumberInput
  amount: BigNumberInput
  transfer_ids: string[]
  status: SettlementStatus
  payout_status: PayoutStatus | null
  payout_reason: string | null
}

const inWindow = (line: SettlementTransferLine, window: SettlementWindow) => {
  const at = new Date(line.updated_at).getTime()
  return at > window.period_start.getTime() && at <= window.period_end.getTime()
}

/**
 * Nets what reached `created` in the window: order and tax transfers count
 * up, reversals and debits count down, credits count up. A non-positive
 * amount aborts the settlement so the chain of windows stays unbroken.
 */
export function buildSettlement(
  lines: SettlementTransferLine[],
  window: SettlementWindow,
  account: { payouts_enabled: boolean; ignored: boolean; seller_id: string } | null
): SettlementTotals {
  let transfers: BigNumberInput = 0
  let reversals: BigNumberInput = 0
  let adjustments: BigNumberInput = 0
  const ids: string[] = []

  for (const line of lines) {
    if (line.status !== TransferStatus.CREATED || !inWindow(line, window)) {
      continue
    }
    ids.push(line.id)
    switch (line.type) {
      case TransferType.ORDER:
      case TransferType.TAX:
        transfers = MathBN.add(transfers, line.amount)
        break
      case TransferType.REFUND_REVERSAL:
        reversals = MathBN.add(reversals, line.amount)
        break
      case TransferType.ADJUSTMENT_CREDIT:
        adjustments = MathBN.add(adjustments, line.amount)
        break
      case TransferType.ADJUSTMENT_DEBIT:
        adjustments = MathBN.sub(adjustments, line.amount)
        break
    }
  }

  const amount = MathBN.add(MathBN.sub(transfers, reversals), adjustments)

  if (MathBN.lte(amount, 0)) {
    return {
      transfers_total: transfers,
      reversals_total: reversals,
      adjustments_total: adjustments,
      amount,
      transfer_ids: ids,
      status: SettlementStatus.ABORTED,
      payout_status: null,
      payout_reason: formatStatusReason(PayoutStatusReason.INVALID_AMOUNT, MathBN.convert(amount).toString()),
    }
  }

  if (!account) {
    return {
      transfers_total: transfers,
      reversals_total: reversals,
      adjustments_total: adjustments,
      amount,
      transfer_ids: ids,
      status: SettlementStatus.OPEN,
      payout_status: PayoutStatus.ON_HOLD,
      payout_reason: formatStatusReason(PayoutStatusReason.ACCOUNT_NOT_READY, "unknown"),
    }
  }

  if (!account.payouts_enabled) {
    return {
      transfers_total: transfers,
      reversals_total: reversals,
      adjustments_total: adjustments,
      amount,
      transfer_ids: ids,
      status: SettlementStatus.OPEN,
      payout_status: PayoutStatus.ON_HOLD,
      payout_reason: formatStatusReason(PayoutStatusReason.ACCOUNT_PAYOUTS_DISABLED, account.seller_id),
    }
  }

  return {
    transfers_total: transfers,
    reversals_total: reversals,
    adjustments_total: adjustments,
    amount,
    transfer_ids: ids,
    status: SettlementStatus.OPEN,
    payout_status: PayoutStatus.PENDING,
    payout_reason: null,
  }
}
