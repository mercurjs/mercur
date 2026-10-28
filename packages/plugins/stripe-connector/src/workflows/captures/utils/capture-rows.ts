import { BigNumberInput } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import {
  FulfillableOrder,
  deriveFulfillmentStatus,
} from "@mercurjs/core/workflows/payout/utils/fulfillment-status"

import { CaptureDTO, CaptureStatus, ResolvedStripeConnectorOptions } from "../../../types/common"
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

export type CaptureOrderRow = FulfillableOrder & {
  id: string
  status: string
  canceled_at?: Date | string | null
  total: BigNumberInput
  metadata?: Record<string, unknown> | null
}

export type CaptureSources = {
  collections: CollectionRow[]
  cart_links: { cart_id: string; payment_collection_id: string }[]
  groups: { id: string; cart_id: string | null; orders?: { id: string }[] | null }[]
  orders: CaptureOrderRow[]
}

export type CaptureDecisionOptions = Pick<ResolvedStripeConnectorOptions, "capture" | "transfers">

/**
 * The capture state of each order group's cart payment, decided the way the
 * capture job acts on it.
 */
export function buildCaptureRows(
  sources: CaptureSources,
  options: CaptureDecisionOptions,
  now: Date
): CaptureRowInput[] {
  const cartByCollection = new Map(sources.cart_links.map((link) => [link.payment_collection_id, link.cart_id]))
  const orderById = new Map(sources.orders.map((order) => [order.id, order]))
  const groupByCart = new Map(sources.groups.map((group) => [group.cart_id, group]))

  const rows: CaptureRowInput[] = []

  for (const collection of sources.collections) {
    const group = groupByCart.get(cartByCollection.get(collection.id) ?? "")
    const payments = collection.payments ?? []
    const payment = payments.find((p) => !p.canceled_at && !isCaptured(p)) ?? payments[0]
    if (!group || !payment) {
      continue
    }

    const groupOrders = (group.orders ?? [])
      .map((ref) => orderById.get(ref.id))
      .filter((order): order is CaptureOrderRow => !!order)
      .map((order) => ({
        id: order.id,
        status: order.status,
        canceled_at: order.canceled_at ?? null,
        fulfillment_status: deriveFulfillmentStatus(order),
        total: order.total,
        accepted: order.metadata && "accepted" in order.metadata ? !!order.metadata.accepted : null,
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

export type CaptureSyncPlan = {
  create: CaptureRowInput[]
  update: (CaptureRowInput & { id: string; status_reason: string | null })[]
}

// A failed attempt stays visible until the payment is captured or canceled,
// even while the decision still says capture or cancel.
const keepFailed = (existing: CaptureDTO, next: CaptureStatus) =>
  existing.status === CaptureStatus.FAILED && (next === CaptureStatus.READY || next === CaptureStatus.CANCELABLE)

export function planCaptureSync(rows: CaptureRowInput[], existing: CaptureDTO[]): CaptureSyncPlan {
  const byGroup = new Map(existing.map((row) => [row.order_group_id, row]))
  const plan: CaptureSyncPlan = { create: [], update: [] }

  for (const row of rows) {
    const current = byGroup.get(row.order_group_id)
    if (!current) {
      plan.create.push(row)
      continue
    }
    const status = keepFailed(current, row.status) ? CaptureStatus.FAILED : row.status
    plan.update.push({
      ...row,
      id: current.id,
      status,
      status_reason: status === CaptureStatus.FAILED ? current.status_reason : null,
    })
  }

  return plan
}
