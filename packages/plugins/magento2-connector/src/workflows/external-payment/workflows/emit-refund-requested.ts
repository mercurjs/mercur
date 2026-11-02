import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { MagentoWebhookEvents } from "../../../types"
import { buildRefundRequestedEventStep } from "../steps"

export type EmitRefundRequestedWorkflowInput = {
  payment_id: string
}

export const emitRefundRequestedWorkflowId = "emit-refund-requested"
/**
 * A refund recorded in Mercur on an external-provider payment moved no money:
 * the storefront that captured the payment has to execute it. This announces
 * it as `order.refund_requested`.
 */
export const emitRefundRequestedWorkflow = createWorkflow(
  emitRefundRequestedWorkflowId,
  (input: WorkflowData<EmitRefundRequestedWorkflowInput>) => {
    const payments = useQueryGraphStep({
      entity: "payment",
      fields: [
        "id",
        "provider_id",
        "currency_code",
        "payment_collection_id",
        "refunds.id",
        "refunds.amount",
        "refunds.note",
        "refunds.metadata",
        "refunds.created_at",
      ],
      filters: { id: input.payment_id },
    }).config({ name: "payment" })

    const collectionId = transform({ payments }, ({ payments }) =>
      payments.data[0]?.payment_collection_id ?? "__none__"
    )

    const links = useQueryGraphStep({
      entity: "order_payment_collection",
      fields: ["order_id"],
      filters: { payment_collection_id: collectionId },
    }).config({ name: "order-payment-collection" })

    const events = buildRefundRequestedEventStep(
      transform({ payments, links }, ({ payments, links }) => ({
        payment: payments.data[0] ?? null,
        order_id: links.data[0]?.order_id ?? null,
      }))
    )

    when({ events }, ({ events }) => events.length > 0).then(() => {
      emitEventStep({ eventName: MagentoWebhookEvents.REFUND_REQUESTED, data: events })
    })

    return new WorkflowResponse(events)
  }
)
