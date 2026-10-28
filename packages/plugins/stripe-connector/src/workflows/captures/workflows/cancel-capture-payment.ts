import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { cancelPaymentStep } from "@medusajs/medusa/core-flows"

export const cancelCapturePaymentWorkflowId = "cancel-stripe-capture-payment"

export const cancelCapturePaymentWorkflow = createWorkflow(
  cancelCapturePaymentWorkflowId,
  function (input: { payment_id: string }) {
    cancelPaymentStep({ paymentIds: input.payment_id })
    return new WorkflowResponse(void 0)
  }
)
