import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { MagentoWebhookEvents } from "../types"
import { deliverMagentoWebhookWorkflow } from "../workflows"

export default async function magentoWebhookDeliverOnCreateHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await deliverMagentoWebhookWorkflow(container).run({
    input: { delivery_id: event.data.id },
  })
}

export const config: SubscriberConfig = {
  event: MagentoWebhookEvents.DELIVERY_CREATED,
  context: { subscriberId: "magento-webhook-deliver-on-create" },
}
