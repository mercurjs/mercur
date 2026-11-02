import { model } from "@medusajs/framework/utils"

export const ConnectorCheckpoint = model.define("connector_checkpoint", {
  id: model.id({ prefix: "cchk" }).primaryKey(),
  key: model.text().unique(),
  value: model.text().nullable(),
})
