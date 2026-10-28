import { BigNumberInput, FulfillmentStatus } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import {
  PayoutDTO,
  PayoutReversalDTO,
  PayoutStatus,
  PayoutStatusReason,
  PayoutStatusReasonCode,
} from "@mercurjs/types"

import { getCurrencyDecimalDigits } from "../../payment/utils/split-order-payment"
import {
  FulfillableOrder,
  ORDER_FULFILLMENT_FIELDS,
  deriveFulfillmentStatus,
  fulfillmentReached,
} from "./fulfillment-status"

type AmountRow = { amount: BigNumberInput; raw_amount?: BigNumberInput | null }
type RefundRow = AmountRow & { id: string }
type PaymentRow = AmountRow & {
  id: string
  captured_at: Date | string | null
  canceled_at: Date | string | null
  data: Record<string, unknown> | null
  captures?: AmountRow[] | null
  refunds?: RefundRow[] | null
}

export type PayoutOrder = FulfillableOrder & {
  id: string
  status: string
  canceled_at: Date | string | null
  total: BigNumberInput
  currency_code: string
  credit_lines?: { amount: BigNumberInput }[] | null
  shipping_methods?: { id: string }[] | null
  seller?: {
    id: string
    payout_account?: { id: string; payouts_enabled: boolean } | null
  } | null
  payment_collections?: { payments?: PaymentRow[] | null }[] | null
}

export type CommissionLine = {
  amount: BigNumberInput
  item_id?: string | null
  shipping_method_id?: string | null
}

export type PaymentState = {
  id: string
  captured: boolean
  canceled: boolean
  fully_refunded: boolean
  data: Record<string, unknown>
} | null

export type PayoutDecision = {
  status: PayoutStatus
  status_reason: PayoutStatusReasonCode | null
  status_detail: string | null
  amount: BigNumberInput
}

export const PAYOUT_ORDER_FIELDS = [
  "id",
  "status",
  "canceled_at",
  "total",
  "currency_code",
  ...ORDER_FULFILLMENT_FIELDS,
  "credit_lines.amount",
  "shipping_methods.id",
  "seller.id",
  "seller.payout_account.id",
  "seller.payout_account.payouts_enabled",
  "payment_collections.payments.id",
  "payment_collections.payments.amount",
  "payment_collections.payments.raw_amount",
  "payment_collections.payments.captured_at",
  "payment_collections.payments.canceled_at",
  "payment_collections.payments.data",
  "payment_collections.payments.captures.amount",
  "payment_collections.payments.captures.raw_amount",
  "payment_collections.payments.refunds.id",
  "payment_collections.payments.refunds.amount",
  "payment_collections.payments.refunds.raw_amount",
]

export const REVERSAL_ORDER_FIELDS = [
  "id",
  "total",
  "currency_code",
  "credit_lines.amount",
  "items.id",
  "shipping_methods.id",
  "payment_collections.payments.refunds.id",
  "payment_collections.payments.refunds.amount",
  "payment_collections.payments.refunds.raw_amount",
]

const RETRIABLE = [PayoutStatus.FAILED, PayoutStatus.ON_HOLD]

const sum = (rows: AmountRow[] | null | undefined) =>
  (rows ?? []).reduce<BigNumberInput>((acc, row) => MathBN.add(acc, row.raw_amount ?? row.amount), 0)

const refundsOf = (order: Pick<PayoutOrder, "payment_collections">) =>
  (order.payment_collections ?? []).flatMap((c) => c.payments ?? []).flatMap((p) => p.refunds ?? [])

const hold = (reason: PayoutStatusReasonCode, detail: string | null = null): PayoutDecision => ({
  status: PayoutStatus.ON_HOLD,
  status_reason: reason,
  status_detail: detail,
  amount: 0,
})

const abort = (reason: PayoutStatusReasonCode, detail: string | null = null): PayoutDecision => ({
  status: PayoutStatus.ABORTED,
  status_reason: reason,
  status_detail: detail,
  amount: 0,
})

const ready = (amount: BigNumberInput, currencyCode?: string | null): PayoutDecision => {
  const rounded = MathBN.convert(amount, getCurrencyDecimalDigits(currencyCode))
  return MathBN.lte(rounded, 0)
    ? abort(PayoutStatusReason.INVALID_AMOUNT, `Amount must be positive, input was: ${MathBN.convert(amount).toString()}`)
    : { status: PayoutStatus.PENDING, status_reason: null, status_detail: null, amount: rounded }
}

const countBy = (statuses: string[]) =>
  statuses.reduce<Record<string, number>>((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})

/** Order total before refunds: Medusa books a refund as a credit line that lowers `total`. */
export function grossTotalOf(order: Pick<PayoutOrder, "total" | "credit_lines">): BigNumberInput {
  return (order.credit_lines ?? []).reduce<BigNumberInput>((acc, line) => MathBN.add(acc, line.amount), order.total)
}

export function paymentStateOf(order: Pick<PayoutOrder, "payment_collections">): PaymentState {
  const payments = (order.payment_collections ?? []).flatMap((c) => c.payments ?? [])
  const payment = payments.find((p) => !p.canceled_at) ?? payments[0]
  if (!payment) {
    return null
  }

  const captured = sum(payment.captures)
  const isCaptured = !!payment.captured_at || MathBN.gt(captured, 0)

  return {
    id: payment.id,
    captured: isCaptured,
    canceled: !!payment.canceled_at,
    fully_refunded:
      isCaptured &&
      MathBN.gte(sum(payment.refunds), MathBN.gt(captured, 0) ? captured : payment.raw_amount ?? payment.amount),
    data: (payment.data ?? {}) as Record<string, unknown>,
  }
}

export function commissionTotalsOf(
  orders: Pick<PayoutOrder, "id" | "items" | "shipping_methods">[],
  lines: CommissionLine[]
): Map<string, BigNumberInput> {
  const owner = new Map<string, string>()
  for (const order of orders) {
    for (const item of order.items ?? []) owner.set(item.id, order.id)
    for (const method of order.shipping_methods ?? []) owner.set(method.id, order.id)
  }

  const totals = new Map<string, BigNumberInput>(orders.map((order) => [order.id, 0]))
  for (const line of lines) {
    const orderId = owner.get(line.item_id ?? "") ?? owner.get(line.shipping_method_id ?? "")
    if (orderId) {
      totals.set(orderId, MathBN.add(totals.get(orderId) ?? 0, line.amount ?? 0))
    }
  }

  return totals
}

export function commissionLineFilters(orders: Pick<PayoutOrder, "items" | "shipping_methods">[]) {
  const itemIds = orders.flatMap((order) => (order.items ?? []).map((item) => item.id))
  const shippingMethodIds = orders.flatMap((order) => (order.shipping_methods ?? []).map((method) => method.id))

  return {
    $or: [
      ...(itemIds.length ? [{ item_id: itemIds }] : []),
      ...(shippingMethodIds.length ? [{ shipping_method_id: shippingMethodIds }] : []),
    ],
  }
}

/**
 * Order of checks: canceled, account, fulfilled, paid, amount.
 */
export function decideOrderPayout(input: {
  order: {
    seller_id: string
    status: string
    canceled_at?: Date | string | null
    fulfillment_status: string | null
    total: BigNumberInput
    currency_code?: string | null
  }
  account: { id: string; payouts_enabled: boolean } | null
  payment: PaymentState
  commission_total: BigNumberInput
  required_fulfillment_status: FulfillmentStatus
}): PayoutDecision {
  const { order, account, payment } = input

  if (order.status === "canceled" || order.canceled_at) {
    return abort(PayoutStatusReason.ORDER_ABORTED, `Order cannot be processed, status is ${order.status}`)
  }
  if (!account) {
    return hold(PayoutStatusReason.ACCOUNT_NOT_READY, `Cannot find payout account for seller ${order.seller_id}`)
  }
  if (!account.payouts_enabled) {
    return hold(PayoutStatusReason.ACCOUNT_PAYOUTS_DISABLED, `Payouts are disabled for seller ${order.seller_id}`)
  }
  if (!fulfillmentReached(order.fulfillment_status, input.required_fulfillment_status)) {
    return hold(
      PayoutStatusReason.ORDER_NOT_READY,
      `Order is not ready yet, status is ${order.fulfillment_status ?? "not_fulfilled"}`
    )
  }
  if (!payment) {
    return hold(PayoutStatusReason.PAYMENT_NOT_READY, "Payment is not ready yet, status is missing")
  }
  if (payment.canceled) {
    return abort(PayoutStatusReason.PAYMENT_CANCELED, `Payment ${payment.id} has been canceled`)
  }
  if (payment.fully_refunded) {
    return abort(PayoutStatusReason.PAYMENT_REFUNDED, `Payment ${payment.id} has been fully refunded`)
  }
  if (!payment.captured) {
    return hold(PayoutStatusReason.PAYMENT_NOT_READY, `Payment ${payment.id} is not ready yet, status is authorized`)
  }

  return ready(MathBN.sub(order.total, input.commission_total), order.currency_code)
}

/**
 * The seller gives back the refunded amount minus the commission share on
 * it, once the order payout is paid.
 */
export function decideReversal(input: {
  refund_id: string
  refund_amount: BigNumberInput
  refund_canceled: boolean
  order_total: BigNumberInput
  commission_total: BigNumberInput
  currency_code?: string | null
  payout: { id: string; status: PayoutStatus; provider_payout_id: string | null } | null
}): PayoutDecision {
  const payout = input.payout

  if (input.refund_canceled || payout?.status === PayoutStatus.ABORTED) {
    return abort(PayoutStatusReason.REFUND_ABORTED, `Refund ${input.refund_id} has been aborted`)
  }
  if (!payout || payout.status !== PayoutStatus.PAID || !payout.provider_payout_id) {
    return hold(
      PayoutStatusReason.PAYOUT_NOT_READY,
      "The payout has to be paid before it can be reversed for a refund"
    )
  }

  const share = MathBN.gt(input.order_total, 0)
    ? MathBN.div(MathBN.mult(input.commission_total, input.refund_amount), input.order_total)
    : 0

  return ready(MathBN.sub(input.refund_amount, share), input.currency_code)
}

export type OrderPayoutsPlan = {
  create: {
    seller_id: string
    order_id: string
    account_id: string
    amount: number
    currency_code: string
    status: PayoutStatus
    status_reason: string | null
    data: Record<string, unknown>
  }[]
  update: {
    id: string
    account_id: string
    amount: number
    status: PayoutStatus
    status_reason: string | null
    data: Record<string, unknown>
  }[]
  counts: Record<string, number>
}

/**
 * A payout that is paid, processing or aborted is left alone; one on hold or
 * failed is re-decided. A refund that landed before the payout cannot be
 * reversed later, so the payout is built net of it and carries its commission share.
 */
export function planOrderPayouts(input: {
  orders: PayoutOrder[]
  commission_lines: CommissionLine[]
  payouts: PayoutDTO[]
  required_fulfillment_status: FulfillmentStatus
}): OrderPayoutsPlan {
  const commissions = commissionTotalsOf(input.orders, input.commission_lines)
  const existing = new Map(input.payouts.map((payout) => [payout.order_id as string, payout]))
  const plan: OrderPayoutsPlan = { create: [], update: [], counts: {} }
  const statuses: string[] = []

  for (const order of input.orders) {
    const current = existing.get(order.id)
    if (current && !RETRIABLE.includes(current.status)) {
      continue
    }

    const account = order.seller?.payout_account ?? null
    const payment = paymentStateOf(order)
    const refunds = refundsOf(order)
    const gross = grossTotalOf(order)
    const absorbed = sum(refunds)
    const net = MathBN.sub(gross, absorbed)
    const commission = commissions.get(order.id) ?? 0

    const decision = decideOrderPayout({
      order: {
        seller_id: order.seller?.id ?? "",
        status: order.status,
        canceled_at: order.canceled_at,
        fulfillment_status: deriveFulfillmentStatus(order),
        total: net,
        currency_code: order.currency_code,
      },
      account,
      payment,
      commission_total:
        MathBN.gt(absorbed, 0) && MathBN.gt(gross, 0) ? MathBN.div(MathBN.mult(commission, net), gross) : commission,
      required_fulfillment_status: input.required_fulfillment_status,
    })

    const data = {
      source_payment: payment ? { id: payment.id, data: payment.data } : null,
      status_detail: decision.status_detail,
      absorbed_refund_ids: refunds.map((refund) => refund.id),
    }

    if (current) {
      plan.update.push({
        id: current.id,
        account_id: account?.id ?? current.account_id,
        amount: Number(decision.amount),
        status: decision.status,
        status_reason: decision.status_reason,
        data: { ...(current.data ?? {}), ...data },
      })
    } else if (account && order.seller) {
      plan.create.push({
        seller_id: order.seller.id,
        order_id: order.id,
        account_id: account.id,
        amount: Number(decision.amount),
        currency_code: order.currency_code,
        status: decision.status,
        status_reason: decision.status_reason,
        data,
      })
    } else {
      statuses.push("awaiting_account")
      continue
    }

    statuses.push(decision.status)
  }

  plan.counts = countBy(statuses)
  return plan
}

export type PayoutReversalsPlan = {
  create: {
    payout_id: string
    refund_id: string
    amount: number
    status: PayoutStatus
    status_reason: string | null
    data: Record<string, unknown>
  }[]
  update: {
    id: string
    amount: number
    status: PayoutStatus
    status_reason: string | null
    data: Record<string, unknown>
  }[]
  counts: Record<string, number>
}

/**
 * Every refund on an order whose payout exists gets one reversal, net of the
 * commission share on it. Refunds the payout already absorbed are skipped.
 */
export function planPayoutReversals(input: {
  orders: PayoutOrder[]
  commission_lines: CommissionLine[]
  payouts: (PayoutDTO & { reversals?: PayoutReversalDTO[] })[]
}): PayoutReversalsPlan {
  const commissions = commissionTotalsOf(input.orders, input.commission_lines)
  const payoutByOrder = new Map(input.payouts.map((payout) => [payout.order_id as string, payout]))
  const plan: PayoutReversalsPlan = { create: [], update: [], counts: {} }
  const statuses: string[] = []

  for (const order of input.orders) {
    const payout = payoutByOrder.get(order.id)
    if (!payout) {
      continue
    }

    const reversals = new Map((payout.reversals ?? []).map((reversal) => [reversal.refund_id, reversal]))
    const absorbed = new Set((payout.data?.absorbed_refund_ids ?? []) as string[])

    for (const refund of refundsOf(order)) {
      const existing = reversals.get(refund.id)
      if (existing && !RETRIABLE.includes(existing.status)) {
        continue
      }

      if (absorbed.has(refund.id)) {
        if (existing) {
          plan.update.push({
            id: existing.id,
            amount: 0,
            status: PayoutStatus.ABORTED,
            status_reason: PayoutStatusReason.REFUND_ABSORBED,
            data: { ...(existing.data ?? {}), status_detail: `Refund ${refund.id} was deducted from the payout` },
          })
        }
        statuses.push("absorbed")
        continue
      }

      const decision = decideReversal({
        refund_id: refund.id,
        refund_amount: refund.raw_amount ?? refund.amount,
        refund_canceled: false,
        order_total: grossTotalOf(order),
        commission_total: commissions.get(order.id) ?? 0,
        currency_code: order.currency_code,
        payout: {
          id: payout.id,
          status: payout.status,
          provider_payout_id: ((payout.data?.provider as { id?: string } | undefined)?.id) ?? null,
        },
      })

      const row = { amount: Number(decision.amount), status: decision.status, status_reason: decision.status_reason }
      if (existing) {
        plan.update.push({ id: existing.id, ...row, data: { ...(existing.data ?? {}), status_detail: decision.status_detail } })
      } else {
        plan.create.push({ payout_id: payout.id, refund_id: refund.id, ...row, data: { status_detail: decision.status_detail } })
      }
      statuses.push(decision.status)
    }
  }

  plan.counts = countBy(statuses)
  return plan
}
