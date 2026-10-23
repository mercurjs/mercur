import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { OrderWorkflowEvents } from "@medusajs/framework/utils"
import { PayoutJobTrigger } from "@mercurjs/types"

import { processTransfers } from "../workflows/payout/pipeline"
import { runPayoutJob } from "../workflows/payout/utils/run-payout-job"

export default async function payoutOrderChangedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  const orderId = event.data.order_id ?? event.data.id
  if (!orderId) {
    return
  }
  await runPayoutJob(container, "payout-process-transfers", PayoutJobTrigger.SUBSCRIBER, (ctx) =>
    processTransfers(ctx, [orderId])
  )
}

export const config: SubscriberConfig = {
  event: [OrderWorkflowEvents.FULFILLMENT_CREATED, OrderWorkflowEvents.CANCELED],
  context: { subscriberId: "payout-order-changed" },
}
