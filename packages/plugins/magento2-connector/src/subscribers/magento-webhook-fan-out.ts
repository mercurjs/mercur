import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { FULFILLMENT_SCOPED_EVENTS, MAGENTO_WEBHOOK_EVENTS } from "../types"
import { enqueueMagentoWebhookDeliveriesWorkflow } from "../workflows"

export default async function magentoWebhookFanOutHandler({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  let payload: Record<string, unknown> = event.data ?? {}

  if (FULFILLMENT_SCOPED_EVENTS.includes(event.name) && typeof payload.id === "string") {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "order_fulfillment",
      fields: ["order_id", "fulfillment_id"],
      filters: { fulfillment_id: payload.id },
    })
    payload = { ...payload, fulfillment_id: payload.id, order_id: data[0]?.order_id ?? null }
  }

  await enqueueMagentoWebhookDeliveriesWorkflow(container).run({
    input: { event: event.name, payload },
  })
}

export const config: SubscriberConfig = {
  event: [...MAGENTO_WEBHOOK_EVENTS],
  context: { subscriberId: "magento-webhook-fan-out" },
}
