import { MedusaContainer } from "@medusajs/framework/types"
import { MathBN, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type { CapturePaymentWorkflowInput } from "@medusajs/medusa/core-flows"

import {
  hasSplitOrderCollections,
  isPaymentCaptured,
  loadSplitOrderPaymentGroup,
  SplitOrderGroupPayment,
} from "../utils"
import { capturePaymentWorkflow } from "../workflows/payment-hooks"

export type SyncSplitOrderPaymentCapturesStepInput = {
  payment_id: string
}

// The payment module accepts `is_captured` to record a capture the provider
// already made; the workflow input type just does not declare it.
type RecordCaptureInput = CapturePaymentWorkflowInput & { is_captured: true }

const sum = (payments: { amount: SplitOrderGroupPayment["amount"] }[]) =>
  payments.reduce((acc, payment) => MathBN.add(acc, payment.amount), MathBN.convert(0))

const LOCK_TIMEOUT_SECONDS = 30

const syncCaptures = async (
  container: MedusaContainer,
  cartId: string
): Promise<string[]> => {
  const group = await loadSplitOrderPaymentGroup(container, { cart_id: cartId })
  const cartPayment = group?.payment

  if (!group || !cartPayment) {
    return []
  }

  const shares = group.orders.flatMap((order) => order.payment ?? [])
  const payments = [cartPayment, ...shares]

  if (!payments.some(isPaymentCaptured)) {
    return []
  }

  const captured: string[] = []

  for (const payment of payments) {
    if (isPaymentCaptured(payment) || payment.canceled_at) {
      continue
    }

    const captureInput: RecordCaptureInput = {
      payment_id: payment.id,
      is_captured: true,
    }
    await capturePaymentWorkflow(container).run({ input: captureInput })
    captured.push(payment.id)
  }

  const canceledAmount = sum(
    shares.filter((share) => share.canceled_at && !isPaymentCaptured(share))
  )
  const owed = MathBN.sub(canceledAmount, sum(cartPayment.refunds))

  if (MathBN.gt(owed, 0)) {
    await container.resolve(Modules.PAYMENT).refundPayment({
      payment_id: cartPayment.id,
      amount: owed.toNumber(),
      note: "Share of orders canceled before the payment was captured",
    })
  }

  return captured
}

export const syncSplitOrderPaymentCapturesStepId =
  "sync-split-order-payment-captures"

/**
 * A cart is charged once, so capturing the cart payment or any order's share
 * of it captures the whole charge at the provider. This records that capture
 * on every other payment of the cart, and refunds what was charged for orders
 * canceled before the capture.
 */
export const syncSplitOrderPaymentCapturesStep = createStep(
  syncSplitOrderPaymentCapturesStepId,
  async (input: SyncSplitOrderPaymentCapturesStepInput, { container }) => {
    const resolved = await loadSplitOrderPaymentGroup(container, input)

    if (!resolved || !hasSplitOrderCollections(resolved.payment_collection)) {
      return new StepResponse([] as string[])
    }

    // Each capture recorded here emits `payment.captured` again, and two
    // runs working from the same snapshot would both refund the canceled
    // share. Runs for one cart take turns and re-read under the lock.
    const captured = await container
      .resolve(Modules.LOCKING)
      .execute(
        `split-order-payment:${resolved.cart_id}`,
        () => syncCaptures(container, resolved.cart_id),
        { timeout: LOCK_TIMEOUT_SECONDS }
      )

    return new StepResponse(captured)
  }
)
