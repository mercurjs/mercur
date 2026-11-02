import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { OrderWorkflowEvents } from "@medusajs/framework/utils"

import { JobTrigger } from "../types/common"
import { runJob } from "../utils/run-job"
import { processOrderChangedPayoutsWorkflow } from "../workflows/payouts/workflows/process-order-changed-payouts"

export default async function payoutOrderChangedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  const orderId = event.data.order_id ?? event.data.id
  if (!orderId) {
    return
  }

  await runJob(container, "payout-process-transfers", JobTrigger.SUBSCRIBER, async () => {
    const { result } = await processOrderChangedPayoutsWorkflow(container).run({ input: { order_id: orderId } })
    return result
  })
}

export const config: SubscriberConfig = {
  event: [OrderWorkflowEvents.FULFILLMENT_CREATED, OrderWorkflowEvents.CANCELED],
  context: { subscriberId: "stripe-connector-payout-order-changed" },
}
