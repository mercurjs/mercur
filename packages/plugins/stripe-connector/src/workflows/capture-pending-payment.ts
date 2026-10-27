import { BigNumberInput } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { cancelPaymentStep } from "@medusajs/medusa/core-flows"
import { capturePaymentWorkflow } from "@mercurjs/core/workflows"

import { CAPTURE_ERROR_KEY } from "../types/common"

export type CapturePendingPaymentWorkflowInput = {
  payment_id: string
  payment_collection_id: string
  amount?: BigNumberInput
}

const recordCaptureErrorStep = createStep(
  "record-capture-error",
  async (
    input: { payment_collection_id: string; error: string | null },
    { container }
  ) => {
    const paymentService = container.resolve(Modules.PAYMENT)
    const collection = await paymentService.retrievePaymentCollection(
      input.payment_collection_id
    )
    const metadata = { ...(collection.metadata ?? {}) }
    if (input.error) {
      metadata[CAPTURE_ERROR_KEY] = input.error.slice(0, 1024)
    } else {
      delete metadata[CAPTURE_ERROR_KEY]
    }
    await paymentService.updatePaymentCollections(input.payment_collection_id, { metadata })
    return new StepResponse(void 0)
  }
)

export const capturePendingPaymentWorkflowId = "capture-pending-payment"

/**
 * Capture the authorized cart payment
 * for the decided amount; a provider error is written on the collection so
 * the next validation run retries and the admin can see why.
 */
export const capturePendingPaymentWorkflow = createWorkflow(
  capturePendingPaymentWorkflowId,
  function (input: CapturePendingPaymentWorkflowInput) {
    const payment = capturePaymentWorkflow.runAsStep({
      input: { payment_id: input.payment_id, amount: input.amount },
    })

    recordCaptureErrorStep({ payment_collection_id: input.payment_collection_id, error: null })

    return new WorkflowResponse(payment)
  }
)

export const cancelPendingPaymentWorkflowId = "cancel-pending-payment"

export const cancelPendingPaymentWorkflow = createWorkflow(
  cancelPendingPaymentWorkflowId,
  function (input: { payment_id: string; payment_collection_id: string }) {
    cancelPaymentStep({ paymentIds: input.payment_id })

    recordCaptureErrorStep({ payment_collection_id: input.payment_collection_id, error: null })

    return new WorkflowResponse(void 0)
  }
)

export const recordCaptureErrorWorkflowId = "record-capture-error"

export const recordCaptureErrorWorkflow = createWorkflow(
  recordCaptureErrorWorkflowId,
  function (input: { payment_collection_id: string; error: string }) {
    recordCaptureErrorStep(input)
    return new WorkflowResponse(void 0)
  }
)
