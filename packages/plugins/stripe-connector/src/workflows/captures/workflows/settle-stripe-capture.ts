import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { cancelPaymentStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { capturePaymentWorkflow } from "@mercurjs/core/workflows"

import { CaptureDTO, CaptureStatus } from "../../../types/common"
import { updateStripeCapturesStep, validateCaptureSettleableStep } from "../steps"
import { CaptureAction } from "../utils/capture-action"

export type SettleStripeCaptureWorkflowInput = {
  order_group_id: string
  action: CaptureAction
}

export const settleStripeCaptureWorkflowId = "settle-stripe-capture"

/** Captures the decided amount of an order group's cart payment, or releases it. */
export const settleStripeCaptureWorkflow = createWorkflow(
  settleStripeCaptureWorkflowId,
  function (input: SettleStripeCaptureWorkflowInput) {
    const { data: captures } = useQueryGraphStep({
      entity: "stripe_capture",
      fields: ["id", "status", "payment_id", "capturable_amount"],
      filters: { order_group_id: input.order_group_id },
    }).config({ name: "settle-capture-query" })

    const capture = transform({ captures }, ({ captures }) => captures[0] as unknown as CaptureDTO | undefined)

    validateCaptureSettleableStep(
      transform({ input, capture }, ({ input, capture }) => ({
        order_group_id: input.order_group_id,
        action: input.action,
        capture: capture ? { status: capture.status, capturable_amount: Number(capture.capturable_amount) } : null,
      }))
    )

    when("capture-cart-payment", { input }, ({ input }) => input.action === "capture").then(() => {
      capturePaymentWorkflow.runAsStep({
        input: transform({ capture }, ({ capture }) => ({
          payment_id: capture!.payment_id,
          amount: capture!.capturable_amount,
        })),
      })
    })

    when("cancel-cart-payment", { input }, ({ input }) => input.action === "cancel").then(() => {
      cancelPaymentStep({ paymentIds: transform({ capture }, ({ capture }) => capture!.payment_id) })
    })

    const updated = updateStripeCapturesStep(
      transform({ input, capture }, ({ input, capture }) => [
        {
          id: capture!.id,
          status: input.action === "capture" ? CaptureStatus.CAPTURED : CaptureStatus.CANCELED,
          status_reason: null,
        },
      ])
    )

    return new WorkflowResponse(transform({ updated }, ({ updated }) => updated[0]))
  }
)
