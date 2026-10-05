import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { addOrderTransactionStep } from "@medusajs/medusa/core-flows"

import {
  createSplitOrderPaymentsStep,
  CreateSplitOrderPaymentsStepInput,
} from "../steps/create-split-order-payments"
import {
  syncSplitOrderPaymentCapturesStep,
  SyncSplitOrderPaymentCapturesStepInput,
} from "../steps/sync-split-order-payment-captures"
import {
  voidSplitOrderPaymentStep,
  VoidSplitOrderPaymentStepInput,
} from "../steps/void-split-order-payment"

export const createSplitOrderPaymentCollectionsWorkflowId =
  "create-split-order-payment-collections"

/**
 * Splits a cart's payment into one payment collection per order, so each order
 * is linked to a payment of its own and Medusa's order and payment workflows
 * (cancel, refund, capture) apply to it unchanged.
 */
export const createSplitOrderPaymentCollectionsWorkflow = createWorkflow(
  createSplitOrderPaymentCollectionsWorkflowId,
  (input: CreateSplitOrderPaymentsStepInput) => {
    const shares = createSplitOrderPaymentsStep(input)

    const transactions = transform({ shares }, ({ shares }) =>
      shares.flatMap((share) =>
        share.captures.map((capture) => ({
          order_id: share.order_id,
          amount: capture.amount,
          currency_code: share.currency_code,
          reference: "capture",
          reference_id: capture.id,
        }))
      )
    )

    addOrderTransactionStep(transactions)

    return new WorkflowResponse(shares)
  }
)

export const syncSplitOrderPaymentCapturesWorkflowId =
  "sync-split-order-payment-captures"

export const syncSplitOrderPaymentCapturesWorkflow = createWorkflow(
  syncSplitOrderPaymentCapturesWorkflowId,
  (input: SyncSplitOrderPaymentCapturesStepInput) => {
    return new WorkflowResponse(syncSplitOrderPaymentCapturesStep(input))
  }
)

export const voidSplitOrderPaymentWorkflowId = "void-split-order-payment"

export const voidSplitOrderPaymentWorkflow = createWorkflow(
  voidSplitOrderPaymentWorkflowId,
  (input: VoidSplitOrderPaymentStepInput) => {
    return new WorkflowResponse(voidSplitOrderPaymentStep(input))
  }
)
