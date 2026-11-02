import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { PaymentEvents } from "@medusajs/framework/utils"

import { emitRefundRequestedWorkflow } from "../workflows"

export default async function magentoRefundRequestedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await emitRefundRequestedWorkflow(container).run({
    input: { payment_id: event.data.id },
  })
}

export const config: SubscriberConfig = {
  event: PaymentEvents.REFUNDED,
  context: { subscriberId: "magento-refund-requested" },
}
