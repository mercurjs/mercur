import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { MAGENTO_WEBHOOK_EVENTS } from "../types"
import { enqueueMagentoWebhookDeliveriesWorkflow } from "../workflows"

export default async function magentoWebhookFanOutHandler({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  await enqueueMagentoWebhookDeliveriesWorkflow(container).run({
    input: { event: event.name, payload: event.data ?? {} },
  })
}

export const config: SubscriberConfig = {
  event: [...MAGENTO_WEBHOOK_EVENTS],
  context: { subscriberId: "magento-webhook-fan-out" },
}
