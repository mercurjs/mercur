import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  refundPaymentWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { MagentoWebhookEvents } from "../../../types"
import { validateExternalPaymentStep } from "../steps"

export type RecordExternalRefundWorkflowInput = {
  order_id: string
  amount: number
  reference?: string
  note?: string
  created_by?: string
}

export const recordExternalRefundWorkflowId = "record-external-refund"
/**
 * Mirrors a refund that already happened in the external storefront onto the
 * order's external-provider payment, so totals, commission lines and the
 * payout balance follow.
 */
export const recordExternalRefundWorkflow = createWorkflow(
  recordExternalRefundWorkflowId,
  (input: WorkflowData<RecordExternalRefundWorkflowInput>) => {
    const orders = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "payment_collections.payments.id",
        "payment_collections.payments.provider_id",
        "payment_collections.payments.captured_at",
      ],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    })

    const validationInput = transform({ input, orders }, ({ input, orders }) => ({
      order_id: input.order_id,
      payments: (orders.data[0]?.payment_collections ?? []).flatMap(
        (pc) => pc?.payments ?? []
      ),
    }))

    const paymentId = validateExternalPaymentStep(validationInput)

    const refundInput = transform({ input, paymentId }, ({ input, paymentId }) => ({
      payment_id: paymentId,
      amount: input.amount,
      note: input.reference
        ? `${input.note ?? "External refund"} (${input.reference})`
        : input.note,
      created_by: input.created_by,
    }))

    const payment = refundPaymentWorkflow.runAsStep({ input: refundInput })

    emitEventStep({
      eventName: MagentoWebhookEvents.REFUND_RECORDED,
      data: transform({ input, paymentId }, ({ input, paymentId }) => ({
        id: input.order_id,
        payment_id: paymentId,
        amount: input.amount,
        reference: input.reference ?? null,
      })),
    })

    return new WorkflowResponse(payment)
  }
)
