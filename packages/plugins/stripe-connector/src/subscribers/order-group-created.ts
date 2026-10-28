import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { OrderGroupWorkflowEvents } from "@mercurjs/core/workflows"

import { syncCapturesWorkflow } from "../workflows/captures/workflows/sync-captures"

export default async function stripeOrderGroupCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await syncCapturesWorkflow(container).run({ input: { order_group_ids: [event.data.id] } })
}

export const config: SubscriberConfig = {
  event: OrderGroupWorkflowEvents.CREATED,
  context: { subscriberId: "stripe-connector-order-group-created" },
}
