import { model } from "@medusajs/framework/utils"

import MagentoWebhookEndpoint from "./magento-webhook-endpoint"

const MagentoWebhookDelivery = model
  .define("magento_webhook_delivery", {
    id: model.id({ prefix: "mwhd" }).primaryKey(),
    event: model.text(),
    payload: model.json(),
    status: model
      .enum(["pending", "delivered", "failed", "dead"])
      .default("pending"),
    attempts: model.number().default(0),
    next_attempt_at: model.dateTime().nullable(),
    response_status: model.number().nullable(),
    response_body: model.text().nullable(),
    delivered_at: model.dateTime().nullable(),
    endpoint: model.belongsTo(() => MagentoWebhookEndpoint, {
      mappedBy: "deliveries",
    }),
  })
  .indexes([
    {
      name: "IDX_magento_webhook_delivery_due",
      on: ["status", "next_attempt_at"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_magento_webhook_delivery_endpoint_id",
      on: ["endpoint_id"],
      where: "deleted_at IS NULL",
    },
  ])

export default MagentoWebhookDelivery
