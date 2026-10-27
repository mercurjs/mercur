import { model } from "@medusajs/framework/utils"

export const ConnectorNotification = model
  .define("connector_notification", {
    id: model.id({ prefix: "cnotif" }).primaryKey(),
    type: model.text(),
    url: model.text(),
    payload: model.json(),
    attempts: model.number().default(0),
    response_status: model.number().nullable(),
    error: model.text().nullable(),
    delivered: model.boolean().default(false),
  })
  .indexes([
    {
      name: "IDX_connector_notification_created_at",
      on: ["created_at"],
      where: "deleted_at IS NULL",
    },
  ])
