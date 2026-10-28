import { BigNumberInput, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MathBN } from "@medusajs/framework/utils"
import {
  ORDER_FULFILLMENT_FIELDS,
  deriveFulfillmentStatus,
} from "@mercurjs/core/workflows/payout/utils/fulfillment-status"

import { CaptureStatus, ResolvedStripeConnectorOptions } from "../../../types/common"
import { CaptureDecision, decideCapture } from "./capture-decision"

type PaymentRow = {
  id: string
  amount: BigNumberInput
  raw_amount?: BigNumberInput | null
  captured_at: Date | string | null
  canceled_at: Date | string | null
  created_at: Date | string
  captures?: { amount: BigNumberInput; raw_amount?: BigNumberInput | null }[] | null
}

type CollectionRow = {
  id: string
  currency_code: string
  payments: PaymentRow[] | null
}

export type CaptureRowInput = {
  order_group_id: string
  payment_collection_id: string
  payment_id: string
  currency_code: string
  authorized_amount: BigNumberInput
  capturable_amount: BigNumberInput
  orders_total: number
  orders_decided: number
  status: CaptureStatus
  authorized_at: Date | null
  expires_at: Date | null
}

const isCaptured = (payment: PaymentRow) =>
  !!payment.captured_at ||
  (payment.captures ?? []).some((capture) => MathBN.gt(capture.raw_amount ?? capture.amount, 0))

export function captureStatusFor(payment: PaymentRow, decision: CaptureDecision): CaptureStatus {
  if (payment.canceled_at) {
    return CaptureStatus.CANCELED
  }
  if (isCaptured(payment)) {
    return CaptureStatus.CAPTURED
  }
  switch (decision.action) {
    case "expired":
      return CaptureStatus.EXPIRED
    case "capture":
      return CaptureStatus.READY
    case "cancel":
      return CaptureStatus.CANCELABLE
    default:
      return CaptureStatus.PENDING
  }
}

/**
 * The capture state of each order group's cart payment, decided the way the
 * capture job acts on it. Without ids it covers every authorized cart
 * payment plus the given open ones, so a payment captured or canceled
 * elsewhere closes its row.
 */
export async function loadCaptureRows(
  container: MedusaContainer,
  options: ResolvedStripeConnectorOptions,
  scope: { order_group_ids?: string[]; payment_collection_ids?: string[] },
  now = new Date()
): Promise<CaptureRowInput[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  let collectionIds: string[]
  if (scope.order_group_ids) {
    if (!scope.order_group_ids.length) return []
    const { data: groups } = await query.graph({
      entity: "order_group",
      fields: ["cart_id"],
      filters: { id: scope.order_group_ids },
    })
    const cartIds = groups.map((group) => group.cart_id).filter((id): id is string => !!id)
    if (!cartIds.length) return []
    const { data: links } = await query.graph({
      entity: "cart_payment_collection",
      fields: ["payment_collection_id"],
      filters: { cart_id: cartIds },
    })
    collectionIds = links.map((link) => link.payment_collection_id)
  } else {
    const { data: authorized } = await query.graph({
      entity: "payment_collection",
      fields: ["id"],
      filters: { status: "authorized" },
    })
    collectionIds = Array.from(
      new Set([...authorized.map((c) => c.id), ...(scope.payment_collection_ids ?? [])])
    )
  }

  if (!collectionIds.length) return []

  const { data: collections } = await query.graph({
    entity: "payment_collection",
    fields: [
      "id",
      "currency_code",
      "payments.id",
      "payments.amount",
      "payments.raw_amount",
      "payments.captured_at",
      "payments.canceled_at",
      "payments.created_at",
      "payments.captures.amount",
      "payments.captures.raw_amount",
    ],
    filters: { id: collectionIds },
  })

  const { data: cartLinks } = await query.graph({
    entity: "cart_payment_collection",
    fields: ["cart_id", "payment_collection_id"],
    filters: { payment_collection_id: collectionIds },
  })
  const cartByCollection = new Map<string, string>(
    cartLinks.map((link) => [link.payment_collection_id, link.cart_id])
  )
  const cartIds = Array.from(new Set(cartByCollection.values()))
  if (!cartIds.length) return []

  const { data: groups } = await query.graph({
    entity: "order_group",
    fields: ["id", "cart_id", "orders.id"],
    filters: { cart_id: cartIds },
  })

  // fulfillment_status only resolves with orders at the root of the query.
  const orderIds = groups.flatMap((group) => (group.orders ?? []).map((order) => order.id))
  const { data: orders } = orderIds.length
    ? await query.graph({
        entity: "order",
        fields: ["id", "status", "canceled_at", "total", "metadata", ...ORDER_FULFILLMENT_FIELDS],
        filters: { id: orderIds },
      })
    : { data: [] }
  const orderById = new Map(orders.map((order) => [order.id, order]))
  const groupByCart = new Map(groups.map((group) => [group.cart_id, group]))

  const rows: CaptureRowInput[] = []

  for (const collection of collections as CollectionRow[]) {
    const group = groupByCart.get(cartByCollection.get(collection.id) ?? "")
    const payments = collection.payments ?? []
    const payment = payments.find((p) => !p.canceled_at && !isCaptured(p)) ?? payments[0]
    if (!group || !payment) {
      continue
    }

    const groupOrders = (group.orders ?? [])
      .map((ref) => orderById.get(ref.id))
      .filter((order): order is NonNullable<typeof order> => !!order)
      .map((order) => ({
        id: order.id,
        status: order.status,
        canceled_at: order.canceled_at ?? null,
        fulfillment_status: deriveFulfillmentStatus(order as never),
        total: order.total,
        accepted:
          order.metadata && "accepted" in order.metadata ? !!order.metadata.accepted : null,
      }))

    const authorizedAmount = payment.raw_amount ?? payment.amount
    const decision = decideCapture({
      orders: groupOrders,
      authorized_amount: authorizedAmount,
      authorized_at: payment.created_at,
      now,
      capture_before_acceptance: options.capture.captureBeforeAcceptance,
      required_fulfillment_status: options.transfers.requiredFulfillmentStatus,
      authorization_window_ms: options.capture.authorizationWindowMs,
      safety_buffer_ms: options.capture.safetyBufferMs,
    })

    rows.push({
      order_group_id: group.id,
      payment_collection_id: collection.id,
      payment_id: payment.id,
      currency_code: collection.currency_code,
      authorized_amount: authorizedAmount,
      capturable_amount: decision.capturable_amount,
      orders_total: decision.orders_total,
      orders_decided: decision.orders_decided,
      status: captureStatusFor(payment, decision),
      authorized_at: payment.created_at ? new Date(payment.created_at) : null,
      expires_at: decision.expires_at,
    })
  }

  return rows
}
