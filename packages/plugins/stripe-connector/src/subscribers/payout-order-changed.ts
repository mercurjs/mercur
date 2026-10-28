import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, OrderWorkflowEvents } from "@medusajs/framework/utils"

import { JobTrigger } from "../types/common"
import { runJob } from "../utils/run-job"
import { syncCapturesWorkflow } from "../workflows/captures/workflows/sync-captures"
import { jobWorkflow } from "../workflows/jobs"

export default async function payoutOrderChangedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  const orderId = event.data.order_id ?? event.data.id
  if (!orderId) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "order_group.id"],
    filters: { id: orderId },
  })
  if (order?.order_group?.id) {
    await syncCapturesWorkflow(container).run({ input: { order_group_ids: [order.order_group.id] } })
  }

  await runJob(
    container,
    "payout-process-transfers",
    JobTrigger.SUBSCRIBER,
    jobWorkflow("payout-process-transfers", container, { order_id: orderId })
  )
}

export const config: SubscriberConfig = {
  event: [OrderWorkflowEvents.FULFILLMENT_CREATED, OrderWorkflowEvents.CANCELED],
  context: { subscriberId: "stripe-connector-payout-order-changed" },
}
