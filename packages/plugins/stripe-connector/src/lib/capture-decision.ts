import { BigNumberInput, FulfillmentStatus } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"

import { fulfillmentReached } from "@mercurjs/core/workflows/payout/utils/payout-factory"

export type CaptureOrderState = {
  id: string
  status: string
  canceled_at?: Date | string | null
  fulfillment_status: string | null
  total: BigNumberInput
  /** Seller acceptance, when the marketplace tracks it; `null` means not tracked. */
  accepted?: boolean | null
}

export type CaptureDecisionInput = {
  orders: CaptureOrderState[]
  authorized_amount: BigNumberInput
  authorized_at: Date | string | null
  now: Date
  capture_before_acceptance: boolean
  required_fulfillment_status: FulfillmentStatus
  authorization_window_ms: number
  safety_buffer_ms: number
}

export type CaptureDecision = {
  action: "wait" | "capture" | "cancel" | "expired"
  capturable_amount: BigNumberInput
  orders_decided: number
  orders_total: number
  expires_at: Date | null
  past_safety_buffer: boolean
}

const isCanceled = (order: CaptureOrderState) =>
  order.status === "canceled" || !!order.canceled_at

/**
 * A group is decided when
 * every order is canceled or ready; the capture amount deducts canceled
 * orders; nothing left means cancel.
 */
export function decideCapture(input: CaptureDecisionInput): CaptureDecision {
  const authorizedAt = input.authorized_at ? new Date(input.authorized_at) : null
  const expiresAt = authorizedAt
    ? new Date(authorizedAt.getTime() + input.authorization_window_ms)
    : null
  const pastSafety = expiresAt
    ? input.now.getTime() >= expiresAt.getTime() - input.safety_buffer_ms
    : false
  const expired = expiresAt ? input.now.getTime() >= expiresAt.getTime() : false

  let canceledTotal: BigNumberInput = 0
  let decided = 0

  for (const order of input.orders) {
    if (isCanceled(order)) {
      canceledTotal = MathBN.add(canceledTotal, order.total)
      decided += 1
      continue
    }

    const ready = input.capture_before_acceptance
      ? order.accepted !== false
      : fulfillmentReached(order.fulfillment_status, input.required_fulfillment_status)

    if (ready) {
      decided += 1
    }
  }

  const capturable = MathBN.sub(input.authorized_amount, canceledTotal)
  const base = {
    capturable_amount: MathBN.gt(capturable, 0) ? capturable : 0,
    orders_decided: decided,
    orders_total: input.orders.length,
    expires_at: expiresAt,
    past_safety_buffer: pastSafety,
  }

  if (expired) {
    return { ...base, action: "expired" }
  }

  const allDecided = input.orders.length > 0 && decided === input.orders.length

  if (!allDecided && !pastSafety) {
    return { ...base, action: "wait" }
  }

  if (MathBN.lte(capturable, 0)) {
    return { ...base, action: "cancel" }
  }

  return { ...base, action: "capture" }
}
