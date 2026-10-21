import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import {
  emitEventStep,
  refundPaymentWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { EXTERNAL_PAYMENT_PROVIDER_ID, MagentoWebhookEvents } from "../types"

export type RecordExternalRefundWorkflowInput = {
  order_id: string
  amount: number
  reference?: string
  note?: string
  created_by?: string
}

export const recordExternalRefundWorkflowId = "record-external-refund"

/**
 * The refund already happened in the external storefront. This only mirrors
 * it onto the order's external-provider payment so the order totals,
 * commission lines, and payout balance follow.
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

    const paymentId = transform({ orders }, ({ orders }) => {
      const payments = (orders.data[0]?.payment_collections ?? [])
        .flatMap((pc) => pc?.payments ?? [])
        .filter(
          (p) =>
            p?.provider_id === EXTERNAL_PAYMENT_PROVIDER_ID && !!p?.captured_at
        )

      if (!payments.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Order has no captured payment on the external provider"
        )
      }

      return payments[0]!.id
    })

    const refundInput = transform(
      { input, paymentId },
      ({ input, paymentId }) => ({
        payment_id: paymentId,
        amount: input.amount,
        note: input.reference
          ? `${input.note ?? "External refund"} (${input.reference})`
          : input.note,
        created_by: input.created_by,
      })
    )

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
