import { model } from "@medusajs/framework/utils"

export const PayoutCheckpoint = model.define("payout_checkpoint", {
  id: model.id({ prefix: "pchk" }).primaryKey(),
  key: model.text().unique(),
  value: model.text().nullable(),
})
