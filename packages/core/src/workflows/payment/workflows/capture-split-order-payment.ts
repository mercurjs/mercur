import { PaymentDTO } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  addOrderTransactionStep,
  type CapturePaymentWorkflowInput,
} from "@medusajs/medusa/core-flows"

import { getSplitOrderPaymentContextStep } from "../steps/get-split-order-payment-context"
import {
  buildSplitOrderCaptureTransactions,
  getSplitOrderCaptureAmount,
  SplitOrderPayment,
} from "../utils"
import { capturePaymentWorkflow } from "./payment-hooks"

export const captureSplitOrderPaymentWorkflowId =
  "capture-split-order-payment"

/**
 * Captures a payment and records the capture on the orders it pays for.
 *
 * Medusa's `capturePaymentWorkflow` finds the order through the
 * order↔payment_collection link, which split orders do not have: their payment
 * collection is shared and stays on the cart. This workflow runs the stock
 * capture and then shares every unrecorded capture between the cart's orders.
 */
export const captureSplitOrderPaymentWorkflow = createWorkflow(
  captureSplitOrderPaymentWorkflowId,
  (input: CapturePaymentWorkflowInput) => {
    const context = getSplitOrderPaymentContextStep({
      payment_id: input.payment_id,
    })

    const captureInput = transform({ input, context }, ({ input, context }) => ({
      payment_id: input.payment_id,
      captured_by: input.captured_by,
      amount: getSplitOrderCaptureAmount(
        context,
        input.payment_id,
        input.amount
      ),
    }))

    const payment = capturePaymentWorkflow.runAsStep({ input: captureInput })

    const transactions = transform(
      { context, payment },
      ({ context, payment }) => {
        const captured = payment as PaymentDTO & SplitOrderPayment
        return buildSplitOrderCaptureTransactions(context, [
          ...context.payments.filter((p) => p.id !== captured.id),
          captured,
        ])
      }
    )

    addOrderTransactionStep(transactions)

    return new WorkflowResponse(payment)
  }
)
