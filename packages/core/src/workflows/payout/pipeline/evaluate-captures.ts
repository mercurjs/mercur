import { BigNumberInput, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MathBN } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules, PayoutStatusReason } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { decideCapture, CaptureDecision } from "../utils/capture-decision"
import { PayoutJobContext } from "../utils/run-payout-job"
import {
  CAPTURE_ERROR_KEY,
  cancelPendingPaymentWorkflow,
  capturePendingPaymentWorkflow,
  recordCaptureErrorWorkflow,
} from "../workflows/capture-pending-payment"

type PaymentRow = {
  id: string
  provider_id: string
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
  metadata: Record<string, unknown> | null
  payments: PaymentRow[] | null
}

export type PendingCapture = {
  collection: CollectionRow
  payment: PaymentRow
  group: {
    id: string
    display_id: number | null
    orders: {
      id: string
      status: string
      canceled_at: Date | string | null
      fulfillment_status: string | null
      total: BigNumberInput
      metadata: Record<string, unknown> | null
    }[]
  }
  decision: CaptureDecision
}

const captured = (payment: PaymentRow) =>
  !!payment.captured_at ||
  (payment.captures ?? []).some((capture) => MathBN.gt(capture.raw_amount ?? capture.amount, 0))

/**
 * Every authorized, uncaptured cart payment whose order group exists, with
 * the capture decision the validation job would take right now.
 */
export async function listPendingCaptures(
  container: MedusaContainer,
  now = new Date()
): Promise<PendingCapture[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const options = service.getOptions()

  const { data: collections } = await query.graph({
    entity: "payment_collection",
    fields: [
      "id",
      "currency_code",
      "metadata",
      "payments.id",
      "payments.provider_id",
      "payments.amount",
      "payments.raw_amount",
      "payments.captured_at",
      "payments.canceled_at",
      "payments.created_at",
      "payments.captures.amount",
      "payments.captures.raw_amount",
    ],
    filters: { status: "authorized" },
  })

  const candidates = (collections as CollectionRow[]).filter((collection) =>
    (collection.payments ?? []).some((payment) => !payment.canceled_at && !captured(payment))
  )

  if (!candidates.length) {
    return []
  }

  const { data: cartLinks } = await query.graph({
    entity: "cart_payment_collection",
    fields: ["cart_id", "payment_collection_id"],
    filters: { payment_collection_id: candidates.map((c) => c.id) },
  })

  const cartByCollection = new Map<string, string>(
    cartLinks.map((link) => [link.payment_collection_id, link.cart_id])
  )

  const cartIds = Array.from(new Set(cartByCollection.values()))
  if (!cartIds.length) {
    return []
  }

  const { data: groups } = await query.graph({
    entity: "order_group",
    fields: [
      "id",
      "display_id",
      "cart_id",
      "orders.id",
      "orders.status",
      "orders.canceled_at",
      "orders.fulfillment_status",
      "orders.total",
      "orders.metadata",
    ],
    filters: { cart_id: cartIds },
  })

  const groupByCart = new Map(groups.map((group) => [group.cart_id, group]))
  const result: PendingCapture[] = []

  for (const collection of candidates) {
    const cartId = cartByCollection.get(collection.id)
    const group = cartId ? groupByCart.get(cartId) : undefined
    const payment = (collection.payments ?? []).find((p) => !p.canceled_at && !captured(p))
    if (!group || !payment) {
      continue
    }

    const orders = (group.orders ?? []).map((order) => ({
      id: order.id,
      status: order.status,
      canceled_at: order.canceled_at ?? null,
      fulfillment_status: order.fulfillment_status ?? null,
      total: order.total,
      metadata: order.metadata ?? null,
      accepted:
        order.metadata && "accepted" in order.metadata ? !!order.metadata.accepted : null,
    }))

    const decision = decideCapture({
      orders,
      authorized_amount: payment.raw_amount ?? payment.amount,
      authorized_at: payment.created_at,
      now,
      capture_before_acceptance: options.capture.captureBeforeAcceptance,
      required_fulfillment_status: options.transfers.requiredFulfillmentStatus,
      authorization_window_ms: options.capture.authorizationWindowMs,
      safety_buffer_ms: options.capture.safetyBufferMs,
    })

    result.push({
      collection,
      payment,
      group: { id: group.id, display_id: group.display_id ?? null, orders },
      decision,
    })
  }

  return result
}

export function toAdminCapture(item: PendingCapture): HttpTypes.AdminPayoutCapture {
  return {
    order_group_id: item.group.id,
    order_group_display_id: item.group.display_id,
    payment_collection_id: item.collection.id,
    payment_id: item.payment.id,
    provider_id: item.payment.provider_id,
    currency_code: item.collection.currency_code,
    authorized_amount: item.payment.raw_amount ?? item.payment.amount,
    capturable_amount: item.decision.capturable_amount,
    orders_total: item.decision.orders_total,
    orders_decided: item.decision.orders_decided,
    decided: item.decision.orders_decided === item.decision.orders_total,
    authorized_at: item.payment.created_at ? new Date(item.payment.created_at) : null,
    expires_at: item.decision.expires_at,
    capture_error: (item.collection.metadata?.[CAPTURE_ERROR_KEY] as string | undefined) ?? null,
  }
}

export async function actOnCapture(container: MedusaContainer, item: PendingCapture, logger: PayoutJobContext["logger"]) {
  const { decision } = item

  if (decision.action === "wait") {
    return "waited"
  }

  if (decision.action === "expired") {
    await recordCaptureErrorWorkflow(container).run({
      input: {
        payment_collection_id: item.collection.id,
        error: PayoutStatusReason.AUTHORIZATION_EXPIRED,
      },
    })
    return "expired"
  }

  if (decision.action === "cancel") {
    const { errors } = await cancelPendingPaymentWorkflow(container).run({
      input: { payment_id: item.payment.id, payment_collection_id: item.collection.id },
      throwOnError: false,
    })
    if (errors?.length) {
      await recordCaptureErrorWorkflow(container).run({
        input: { payment_collection_id: item.collection.id, error: errors[0].error?.message ?? "cancel failed" },
      })
      return "cancel_failed"
    }
    return "canceled"
  }

  if (decision.past_safety_buffer && decision.orders_decided < decision.orders_total) {
    logger.warn(
      `Capturing order group ${item.group.id} before every order is decided: authorization expires soon`
    )
  }

  const { errors } = await capturePendingPaymentWorkflow(container).run({
    input: {
      payment_id: item.payment.id,
      payment_collection_id: item.collection.id,
      amount: decision.capturable_amount,
    },
    throwOnError: false,
  })

  if (errors?.length) {
    await recordCaptureErrorWorkflow(container).run({
      input: { payment_collection_id: item.collection.id, error: errors[0].error?.message ?? "capture failed" },
    })
    return "capture_failed"
  }

  return "captured"
}

export async function validateCaptures(ctx: PayoutJobContext, groupId?: string) {
  const { container, logger, stats, now } = ctx

  let pending = await listPendingCaptures(container, now)
  if (groupId) {
    pending = pending.filter((item) => item.group.id === groupId)
  }

  stats.pending = pending.length
  const counts: Record<string, number> = {}

  for (const item of pending) {
    const outcome = await actOnCapture(container, item, logger)
    counts[outcome] = (counts[outcome] ?? 0) + 1
  }

  Object.assign(stats, counts)
}
