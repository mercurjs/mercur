import {
  OrderEditWorkflowEvents,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { refreshOrderCommissionLinesWorkflow } from "../workflows/commission/workflows/refresh-order-commission-lines"

/**
 * Recompute an order's commission lines whenever its composition changes —
 * order edits, returns, claims, and exchanges — so the seller's commission
 * tracks what the customer actually kept. The refresh is idempotent
 * (delete-then-insert), so re-running on follow-up events is safe.
 */
export default async function orderCommissionRefreshHandler({
  event,
  container,
}: SubscriberArgs<{ order_id?: string; id?: string }>) {
  // Different events surface the order id under different keys.
  const orderId = event.data.order_id ?? event.data.id

  if (!orderId) {
    return
  }

  await refreshOrderCommissionLinesWorkflow(container).run({
    input: { order_ids: [orderId] },
  })
}

export const config: SubscriberConfig = {
  event: [
    OrderEditWorkflowEvents.CONFIRMED,
    OrderWorkflowEvents.RETURN_RECEIVED,
    OrderWorkflowEvents.CLAIM_CREATED,
    OrderWorkflowEvents.EXCHANGE_CREATED,
  ],
  context: {
    subscriberId: "order-commission-refresh-handler",
  },
}
