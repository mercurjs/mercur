import { BigNumberInput, FulfillmentStatus, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MathBN, Modules } from "@medusajs/framework/utils"
import {
  MercurModules,
  PayoutDTO,
  PayoutReversalDTO,
  PayoutStatus,
  PayoutStatusReason,
  formatStatusReason,
} from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import {
  PayoutAccountState,
  PayoutPaymentState,
  decideOrderPayout,
  decideReversal,
} from "./payout-factory"
import { ORDER_FULFILLMENT_FIELDS, deriveFulfillmentStatus } from "./fulfillment-status"

const RETRIABLE = [PayoutStatus.FAILED, PayoutStatus.ON_HOLD]

const ORDER_FIELDS = [
  "id",
  "status",
  "canceled_at",
  ...ORDER_FULFILLMENT_FIELDS,
  "total",
  "currency_code",
  "created_at",
  "credit_lines.amount",
  "shipping_methods.id",
  "seller.id",
  "seller.payout_account.id",
  "seller.payout_account.payouts_enabled",
  "payment_collections.id",
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

type AmountRow = { amount: BigNumberInput; raw_amount?: BigNumberInput | null }

type RefundRow = AmountRow & { id: string }

type CommissionSource = {
  id: string
  items?: { id: string }[] | null
  shipping_methods?: { id: string }[] | null
}

type GrossSource = {
  total: BigNumberInput
  credit_lines?: { amount: BigNumberInput }[] | null
}

type PaymentRow = AmountRow & {
  id: string
  captured_at: Date | string | null
  canceled_at: Date | string | null
  data: Record<string, unknown> | null
  captures?: AmountRow[] | null
  refunds?: RefundRow[] | null
}

export type PayoutOrderRow = CommissionSource &
  GrossSource & {
    status: string
    canceled_at: Date | string | null
    fulfillment_status: string | null
    currency_code: string
    created_at: Date | string
    seller?: {
      id: string
      payout_account?: { id: string; payouts_enabled: boolean } | null
    } | null
    payment_collections?: { id: string; payments?: PaymentRow[] | null }[] | null
  }

export type PayoutEvaluation = {
  pending: string[]
  counts: Record<string, number>
}

const sum = (rows: AmountRow[] | null | undefined) =>
  (rows ?? []).reduce<BigNumberInput>((acc, row) => MathBN.add(acc, row.raw_amount ?? row.amount), 0)

const refundsOf = (order: { payment_collections?: { payments?: { refunds?: RefundRow[] | null }[] | null }[] | null }) =>
  (order.payment_collections ?? []).flatMap((c) => c.payments ?? []).flatMap((p) => p.refunds ?? [])

const counter = () => {
  const counts: Record<string, number> = {}
  return { counts, bump: (key: string) => (counts[key] = (counts[key] ?? 0) + 1) }
}

/** Order total before refunds: Medusa books a refund as a credit line that lowers `total`. */
export function grossTotalOf(order: GrossSource): BigNumberInput {
  return (order.credit_lines ?? []).reduce<BigNumberInput>((acc, line) => MathBN.add(acc, line.amount), order.total)
}

/**
 * A refund that lands before the order is paid out cannot be reversed later
 * (the charge can only fund what is left), so the payout is built net of it
 * and the reversal pass skips it.
 */
export function absorbedRefundsOf(order: PayoutOrderRow): { ids: string[]; total: BigNumberInput } {
  const refunds = refundsOf(order)
  return { ids: refunds.map((r) => r.id), total: sum(refunds) }
}

export function paymentStateOf(order: PayoutOrderRow): PayoutPaymentState {
  const payments = (order.payment_collections ?? []).flatMap((c) => c.payments ?? [])
  const payment = payments.find((p) => !p.canceled_at) ?? payments[0]
  if (!payment) {
    return null
  }
  const capturedTotal = sum(payment.captures)
  const refundedTotal = sum(payment.refunds)
  const captured = !!payment.captured_at || MathBN.gt(capturedTotal, 0)
  const fullyRefunded =
    captured &&
    MathBN.gte(refundedTotal, MathBN.gt(capturedTotal, 0) ? capturedTotal : payment.raw_amount ?? payment.amount)
  return {
    id: payment.id,
    captured,
    canceled: !!payment.canceled_at,
    fully_refunded: fullyRefunded,
    data: (payment.data ?? {}) as Record<string, unknown>,
  }
}

export async function commissionTotalsFor(
  container: MedusaContainer,
  orders: CommissionSource[]
): Promise<Map<string, BigNumberInput>> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const totals = new Map<string, BigNumberInput>()
  const itemOwner = new Map<string, string>()
  const shippingOwner = new Map<string, string>()

  for (const order of orders) {
    totals.set(order.id, 0)
    for (const item of order.items ?? []) itemOwner.set(item.id, order.id)
    for (const method of order.shipping_methods ?? []) shippingOwner.set(method.id, order.id)
  }

  if (!itemOwner.size && !shippingOwner.size) {
    return totals
  }

  const { data: lines } = await query.graph({
    entity: "commission_line",
    fields: ["amount", "item_id", "shipping_method_id"],
    filters: {
      $or: [
        { item_id: Array.from(itemOwner.keys()) },
        { shipping_method_id: Array.from(shippingOwner.keys()) },
      ],
    },
  })

  for (const line of lines) {
    const orderId =
      (line.item_id && itemOwner.get(line.item_id)) ||
      (line.shipping_method_id && shippingOwner.get(line.shipping_method_id))
    if (!orderId) continue
    totals.set(orderId, MathBN.add(totals.get(orderId) ?? 0, line.amount ?? 0))
  }

  return totals
}

export async function loadPayoutOrders(
  container: MedusaContainer,
  filters: Record<string, unknown>,
  pagination: { take: number; order?: Record<string, "ASC" | "DESC"> }
): Promise<PayoutOrderRow[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ORDER_FIELDS,
    filters,
    pagination: { take: pagination.take, order: pagination.order ?? { created_at: "ASC" } },
  })
  return (data as unknown as PayoutOrderRow[]).map((order) => ({
    ...order,
    fulfillment_status: deriveFulfillmentStatus(order as never),
  }))
}

/**
 * Creates or re-evaluates the payout of each order. A payout that is already
 * paid, processing or aborted is left alone; one on hold or failed is
 * re-decided. Returns the ids that are ready to dispatch.
 */
export async function upsertOrderPayouts(
  container: MedusaContainer,
  orderIds: string[],
  requiredFulfillmentStatus: FulfillmentStatus
): Promise<PayoutEvaluation> {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const { counts, bump } = counter()
  const pending: string[] = []
  const links: Record<string, Record<string, string>>[] = []

  if (!orderIds.length) {
    return { pending, counts }
  }

  const orders = await loadPayoutOrders(container, { id: orderIds }, { take: orderIds.length })
  const commissions = await commissionTotalsFor(container, orders)
  const existing = new Map<string, PayoutDTO>(
    (await service.listPayouts({ order_id: orderIds }, { take: null })).map((row) => [row.order_id as string, row])
  )

  for (const order of orders) {
    const current = existing.get(order.id)
    if (current && !RETRIABLE.includes(current.status)) {
      continue
    }

    const accountRow = order.seller?.payout_account ?? null
    const account: PayoutAccountState = accountRow
      ? { id: accountRow.id, payouts_enabled: accountRow.payouts_enabled }
      : null
    const payment = paymentStateOf(order)

    const gross = grossTotalOf(order)
    const absorbed = absorbedRefundsOf(order)
    const net = MathBN.sub(gross, absorbed.total)
    const commission = commissions.get(order.id) ?? 0
    // The seller's share of an absorbed refund carries its share of the commission.
    const effectiveCommission =
      MathBN.gt(absorbed.total, 0) && MathBN.gt(gross, 0)
        ? MathBN.div(MathBN.mult(commission, net), gross)
        : commission

    const decision = decideOrderPayout({
      order: {
        id: order.id,
        seller_id: order.seller?.id ?? "",
        status: order.status,
        canceled_at: order.canceled_at,
        fulfillment_status: order.fulfillment_status,
        total: net,
        currency_code: order.currency_code,
        created_at: order.created_at,
      },
      account,
      payment,
      commission_total: effectiveCommission,
      required_fulfillment_status: requiredFulfillmentStatus,
    })

    const data = {
      source_payment: payment ? { id: payment.id, data: payment.data } : null,
      absorbed_refund_ids: absorbed.ids,
    }

    if (current) {
      const updated = await service.updatePayouts({
        id: current.id,
        status: decision.status,
        status_reason: decision.status_reason,
        amount: Number(decision.amount),
        account_id: account?.id ?? current.account_id,
        data: { ...(current.data ?? {}), ...data },
      })
      bump(updated.status)
      if (updated.status === PayoutStatus.PENDING) pending.push(updated.id)
      continue
    }

    if (!account) {
      // No account to attach the payout to yet; the next evaluation picks the order up again.
      bump("awaiting_account")
      continue
    }

    const created = await service.createPayouts({
      account_id: account.id,
      order_id: order.id,
      amount: Number(decision.amount),
      currency_code: order.currency_code,
      status: decision.status,
      status_reason: decision.status_reason,
      data,
    })
    links.push(
      {
        [MercurModules.PAYOUT]: { payout_id: created.id },
        [MercurModules.SELLER]: { seller_id: order.seller?.id as string },
      },
      {
        [Modules.ORDER]: { order_id: order.id },
        [MercurModules.PAYOUT]: { payout_id: created.id },
      }
    )
    bump(created.status)
    if (created.status === PayoutStatus.PENDING) pending.push(created.id)
  }

  if (links.length) {
    await container.resolve(ContainerRegistrationKeys.LINK).create(links)
  }

  return { pending, counts }
}

/**
 * Every refund on an order whose payout exists gets one reversal, net of the
 * commission share on it. Returns the reversal ids that are ready to dispatch.
 */
export async function upsertPayoutReversals(
  container: MedusaContainer,
  orderIds: string[]
): Promise<PayoutEvaluation> {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { counts, bump } = counter()
  const pending: string[] = []

  if (!orderIds.length) {
    return { pending, counts }
  }

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "total",
      "credit_lines.amount",
      "items.id",
      "shipping_methods.id",
      "payment_collections.payments.refunds.id",
      "payment_collections.payments.refunds.amount",
      "payment_collections.payments.refunds.raw_amount",
    ],
    filters: { id: orderIds },
  })
  const orders = data as unknown as (CommissionSource &
    GrossSource & { payment_collections?: { payments?: { refunds?: RefundRow[] | null }[] | null }[] | null })[]

  const commissions = await commissionTotalsFor(container, orders)
  const payouts = await service.listPayouts({ order_id: orderIds }, { take: null, relations: ["reversals"] })
  const payoutByOrder = new Map(payouts.map((row) => [row.order_id as string, row]))

  for (const order of orders) {
    const payout = payoutByOrder.get(order.id)
    if (!payout) {
      continue
    }

    const reversalByRefund = new Map<string, PayoutReversalDTO>(
      (payout.reversals ?? []).filter((r) => r.refund_id).map((r) => [r.refund_id as string, r])
    )
    const absorbed = new Set((payout.data?.absorbed_refund_ids ?? []) as string[])

    for (const refund of refundsOf(order)) {
      const existing = reversalByRefund.get(refund.id)
      if (existing && !RETRIABLE.includes(existing.status)) {
        continue
      }

      if (absorbed.has(refund.id)) {
        if (existing) {
          await service.updatePayoutReversals({
            id: existing.id,
            status: PayoutStatus.ABORTED,
            status_reason: formatStatusReason(PayoutStatusReason.REFUND_ABSORBED, refund.id),
            amount: 0,
          })
        }
        bump("absorbed")
        continue
      }

      const decision = decideReversal({
        refund_id: refund.id,
        refund_amount: refund.raw_amount ?? refund.amount,
        refund_canceled: false,
        order_total: grossTotalOf(order),
        commission_total: commissions.get(order.id) ?? 0,
        payout: {
          id: payout.id,
          status: payout.status,
          provider_payout_id: ((payout.data?.provider as { id?: string } | undefined)?.id) ?? null,
        },
      })

      const reversal = existing
        ? await service.updatePayoutReversals({
            id: existing.id,
            status: decision.status,
            status_reason: decision.status_reason,
            amount: Number(decision.amount),
          })
        : await service.createPayoutReversals({
            payout_id: payout.id,
            refund_id: refund.id,
            amount: Number(decision.amount),
            status: decision.status,
            status_reason: decision.status_reason,
          })

      bump(reversal.status)
      if (reversal.status === PayoutStatus.PENDING) pending.push(reversal.id)
    }
  }

  return { pending, counts }
}
