import { model } from "@medusajs/framework/utils"

import MagentoWebhookDelivery from "./magento-webhook-delivery"

const MagentoWebhookEndpoint = model
  .define("magento_webhook_endpoint", {
    id: model.id({ prefix: "mwhe" }).primaryKey(),
    url: model.text(),
    secret: model.text(),
    events: model.array(),
    is_active: model.boolean().default(true),
    description: model.text().nullable(),
    metadata: model.json().nullable(),
    deliveries: model.hasMany(() => MagentoWebhookDelivery, {
      mappedBy: "endpoint",
    }),
  })
  .cascades({ delete: ["deliveries"] })

export default MagentoWebhookEndpoint
