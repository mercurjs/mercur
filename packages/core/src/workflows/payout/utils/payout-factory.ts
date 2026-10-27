import { BigNumberInput, FulfillmentStatus } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import {
  PayoutStatus,
  PayoutStatusReason,
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

export type PayoutAccountState = {
  id: string
  payouts_enabled: boolean
} | null

export type PayoutPaymentState = {
  id: string
  captured: boolean
  canceled: boolean
  fully_refunded: boolean
  data: Record<string, unknown>
} | null

export type PayoutOrderState = {
  id: string
  seller_id: string
  status: string
  canceled_at?: Date | string | null
  fulfillment_status: string | null
  total: BigNumberInput
  currency_code: string
  created_at: Date | string
}

export type PayoutDecision = {
  status: PayoutStatus
  status_reason: string | null
  amount: BigNumberInput
}

export type PayoutFactoryInput = {
  order: PayoutOrderState
  account: PayoutAccountState
  payment: PayoutPaymentState
  commission_total: BigNumberInput
  required_fulfillment_status: FulfillmentStatus
}

const hold = (reason: string, amount: BigNumberInput = 0): PayoutDecision => ({
  status: PayoutStatus.ON_HOLD,
  status_reason: reason,
  amount,
})

const abort = (reason: string): PayoutDecision => ({
  status: PayoutStatus.ABORTED,
  status_reason: reason,
  amount: 0,
})

/**
 * Order of checks: account, canceled, fulfilled, paid, amount.
 */
export function decideOrderPayout(input: PayoutFactoryInput): PayoutDecision {
  const { order, account, payment } = input

  if (!account || !account.payouts_enabled) {
    return hold(formatStatusReason(PayoutStatusReason.ACCOUNT_NOT_READY, order.seller_id))
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

  const amount = MathBN.sub(order.total, input.commission_total)

  if (MathBN.lte(amount, 0)) {
    return abort(formatStatusReason(PayoutStatusReason.INVALID_AMOUNT, MathBN.convert(amount).toString()))
  }

  return {
    status: PayoutStatus.PENDING,
    status_reason: null,
    amount,
  }
}

export type ReversalFactoryInput = {
  refund_id: string
  refund_amount: BigNumberInput
  refund_canceled: boolean
  order_total: BigNumberInput
  commission_total: BigNumberInput
  payout: { id: string; status: PayoutStatus; provider_payout_id: string | null } | null
}

/**
 * The seller gives back the refunded amount minus the commission share on
 * it, once the order payout is paid.
 */
export function decideReversal(input: ReversalFactoryInput): PayoutDecision {
  if (input.refund_canceled) {
    return abort(formatStatusReason(PayoutStatusReason.REFUND_ABORTED, input.refund_id))
  }

  const payout = input.payout

  if (payout?.status === PayoutStatus.ABORTED) {
    return abort(formatStatusReason(PayoutStatusReason.REFUND_ABORTED, input.refund_id))
  }

  if (!payout || payout.status !== PayoutStatus.PAID || !payout.provider_payout_id) {
    return hold(PayoutStatusReason.PAYOUT_NOT_READY)
  }

  const share = MathBN.gt(input.order_total, 0)
    ? MathBN.div(MathBN.mult(input.commission_total, input.refund_amount), input.order_total)
    : 0
  const amount = MathBN.sub(input.refund_amount, share)

  if (MathBN.lte(amount, 0)) {
    return abort(formatStatusReason(PayoutStatusReason.INVALID_AMOUNT, MathBN.convert(amount).toString()))
  }

  return {
    status: PayoutStatus.PENDING,
    status_reason: null,
    amount,
  }
}
