import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import {
  capturePaymentWorkflow,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { MagentoWebhookEvents } from "../../../types"
import { resolveExternalCartPaymentStep } from "../steps"

export type CaptureExternalPaymentWorkflowInput = {
  order_group_id: string
  reference?: string
  captured_by?: string
}

export const captureExternalPaymentWorkflowId = "capture-external-payment"
/**
 * Records that the storefront settled the payment of an order group. The
 * cart-level payment is captured once; core splits it between the child
 * orders on `payment.captured`.
 */
export const captureExternalPaymentWorkflow = createWorkflow(
  captureExternalPaymentWorkflowId,
  (input: WorkflowData<CaptureExternalPaymentWorkflowInput>) => {
    const groups = useQueryGraphStep({
      entity: "order_group",
      fields: ["id", "orders.id"],
      filters: { id: input.order_group_id },
      options: { throwIfKeyNotFound: true },
    })

    const payment = resolveExternalCartPaymentStep(
      transform({ input, groups }, ({ input, groups }) => ({
        order_group_id: input.order_group_id,
        order_ids: (groups.data[0]?.orders ?? []).flatMap((o) => (o ? [o.id] : [])),
      }))
    )

    when({ payment }, ({ payment }) => !payment.captured).then(() => {
      capturePaymentWorkflow.runAsStep({
        input: transform({ input, payment }, ({ input, payment }) => ({
          payment_id: payment.payment_id,
          captured_by: input.captured_by,
        })),
      })

      emitEventStep({
        eventName: MagentoWebhookEvents.PAYMENT_CAPTURED,
        data: transform({ input, payment }, ({ input, payment }) => ({
          id: input.order_group_id,
          payment_id: payment.payment_id,
          reference: input.reference ?? null,
        })),
      })
    })

    return new WorkflowResponse(payment)
  }
)
