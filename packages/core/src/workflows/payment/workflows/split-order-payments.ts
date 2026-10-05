import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  splitCapturedCartPaymentStep,
  SplitCapturedCartPaymentStepInput,
} from "../steps/split-captured-cart-payment"
import {
  voidSplitOrderPaymentStep,
  VoidSplitOrderPaymentStepInput,
} from "../steps/void-split-order-payment"

export const splitCapturedCartPaymentWorkflowId = "split-captured-cart-payment"

/**
 * Splits a captured cart payment into one payment collection per order. Takes
 * the cart, one of its orders, or any payment of the cart. Does nothing until
 * the cart payment has a capture.
 */
export const splitCapturedCartPaymentWorkflow = createWorkflow(
  splitCapturedCartPaymentWorkflowId,
  (input: SplitCapturedCartPaymentStepInput) => {
    return new WorkflowResponse(splitCapturedCartPaymentStep(input))
  }
)

export const voidSplitOrderPaymentWorkflowId = "void-split-order-payment"

export const voidSplitOrderPaymentWorkflow = createWorkflow(
  voidSplitOrderPaymentWorkflowId,
  (input: VoidSplitOrderPaymentStepInput) => {
    return new WorkflowResponse(voidSplitOrderPaymentStep(input))
  }
)
