import type { Hook, ReturnWorkflow } from "@medusajs/framework/workflows-sdk"
import {
  markOrderFulfillmentAsDeliveredWorkflow as medusaMarkOrderFulfillmentAsDeliveredWorkflow,
  type MarkOrderFulfillmentAsDeliveredWorkflowInput,
} from "@medusajs/medusa/core-flows"

export type MarkOrderFulfillmentAsDeliveredWorkflowHooks = [
  Hook<
    "fulfillmentDelivered",
    {
      order_id: string
      fulfillment_id: string
    },
    unknown
  >,
]

// The hook comes from the core-flows delivery-hook patch, which is applied in
// memory and cannot reach Medusa's shipped typings, so the patched shape is
// asserted here. Keep in sync with patches/@medusajs+core-flows@*-delivery-hook.patch.
export const markOrderFulfillmentAsDeliveredWorkflow =
  medusaMarkOrderFulfillmentAsDeliveredWorkflow as unknown as ReturnWorkflow<
    MarkOrderFulfillmentAsDeliveredWorkflowInput,
    undefined,
    MarkOrderFulfillmentAsDeliveredWorkflowHooks
  >
