import { BigNumberInput, FulfillmentStatus } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import {
  PayoutStatusReason,
  TransferStatus,
  formatStatusReason,
} from "@mercurjs/types"

const FULFILLMENT_SCALE: FulfillmentStatus[] = [
  "not_fulfilled",
  "partially_fulfilled",
  "fulfilled",
  "partially_shipped",
  "shipped",
  "partially_delivered",
  "delivered",
]

export function fulfillmentReached(
  status: string | null | undefined,
  required: FulfillmentStatus
): boolean {
  if (status === "canceled") {
    return false
  }
  const have = FULFILLMENT_SCALE.indexOf((status ?? "not_fulfilled") as FulfillmentStatus)
  const need = FULFILLMENT_SCALE.indexOf(required)
  return have >= need
}

export type TransferAccountState = {
  id: string
  payouts_enabled: boolean
  ignored: boolean
} | null

export type TransferPaymentState = {
  id: string
  provider_id: string
  captured: boolean
  canceled: boolean
  fully_refunded: boolean
  data: Record<string, unknown>
} | null

export type TransferOrderState = {
  id: string
  seller_id: string
  status: string
  canceled_at?: Date | string | null
  fulfillment_status: string | null
  total: BigNumberInput
  tax_total?: BigNumberInput | null
  currency_code: string
  created_at: Date | string
}

export type TransferDecision = {
  status: TransferStatus
  status_reason: string | null
  amount: BigNumberInput
  tax_amount: BigNumberInput
}

export type TransferFactoryInput = {
  order: TransferOrderState
  account: TransferAccountState
  payment: TransferPaymentState
  commission_total: BigNumberInput
  required_fulfillment_status: FulfillmentStatus
  tax_split: boolean
}

const hold = (reason: string, amount: BigNumberInput = 0): TransferDecision => ({
  status: TransferStatus.ON_HOLD,
  status_reason: reason,
  amount,
  tax_amount: 0,
})

const abort = (reason: string): TransferDecision => ({
  status: TransferStatus.ABORTED,
  status_reason: reason,
  amount: 0,
  tax_amount: 0,
})

/**
 * Order of checks: account, ignored, canceled, fulfilled, paid, amount.
 */
export function decideOrderTransfer(input: TransferFactoryInput): TransferDecision {
  const { order, account, payment } = input

  if (!account || !account.payouts_enabled) {
    return hold(formatStatusReason(PayoutStatusReason.ACCOUNT_NOT_READY, order.seller_id))
  }

  if (account.ignored) {
    return {
      status: TransferStatus.IGNORED,
      status_reason: formatStatusReason(PayoutStatusReason.ACCOUNT_IGNORED, order.seller_id),
      amount: 0,
      tax_amount: 0,
    }
  }

  if (order.status === "canceled" || order.canceled_at) {
    return abort(formatStatusReason(PayoutStatusReason.ORDER_ABORTED, order.status))
  }

  if (!fulfillmentReached(order.fulfillment_status, input.required_fulfillment_status)) {
    return hold(
      formatStatusReason(PayoutStatusReason.ORDER_NOT_READY, order.fulfillment_status ?? "not_fulfilled")
    )
  }

  if (!payment) {
    return hold(formatStatusReason(PayoutStatusReason.PAYMENT_NOT_READY, "none", "missing"))
  }

  if (payment.canceled) {
    return abort(formatStatusReason(PayoutStatusReason.PAYMENT_CANCELED, payment.id))
  }

  if (payment.fully_refunded) {
    return abort(formatStatusReason(PayoutStatusReason.PAYMENT_REFUNDED, payment.id))
  }

  if (!payment.captured) {
    return hold(formatStatusReason(PayoutStatusReason.PAYMENT_NOT_READY, payment.id, "authorized"))
  }

  let amount = MathBN.sub(order.total, input.commission_total)
  let taxAmount: BigNumberInput = 0

  if (input.tax_split) {
    taxAmount = order.tax_total ?? 0
    amount = MathBN.sub(amount, taxAmount)
  }

  if (MathBN.lte(amount, 0)) {
    return abort(formatStatusReason(PayoutStatusReason.INVALID_AMOUNT, MathBN.convert(amount).toString()))
  }

  return {
    status: TransferStatus.PENDING,
    status_reason: null,
    amount,
    tax_amount: taxAmount,
  }
}

export type ReversalFactoryInput = {
  refund_id: string
  refund_amount: BigNumberInput
  refund_canceled: boolean
  order_total: BigNumberInput
  commission_total: BigNumberInput
  order_transfer: { id: string; status: TransferStatus; provider_transfer_id: string | null } | null
}

/**
 * The seller gives
 * back the refunded amount minus the commission share on it, once the order
 * transfer exists.
 */
export function decideReversal(input: ReversalFactoryInput): TransferDecision {
  if (input.refund_canceled) {
    return abort(formatStatusReason(PayoutStatusReason.REFUND_ABORTED, input.refund_id))
  }

  const transfer = input.order_transfer

  if (transfer && (transfer.status === TransferStatus.ABORTED || transfer.status === TransferStatus.IGNORED)) {
    return abort(formatStatusReason(PayoutStatusReason.REFUND_ABORTED, input.refund_id))
  }

  if (!transfer || transfer.status !== TransferStatus.CREATED || !transfer.provider_transfer_id) {
    return hold(PayoutStatusReason.TRANSFER_NOT_READY)
  }

  const share = MathBN.gt(input.order_total, 0)
    ? MathBN.div(MathBN.mult(input.commission_total, input.refund_amount), input.order_total)
    : 0
  const amount = MathBN.sub(input.refund_amount, share)

  if (MathBN.lte(amount, 0)) {
    return abort(formatStatusReason(PayoutStatusReason.INVALID_AMOUNT, MathBN.convert(amount).toString()))
  }

  return {
    status: TransferStatus.PENDING,
    status_reason: null,
    amount,
    tax_amount: 0,
  }
}
