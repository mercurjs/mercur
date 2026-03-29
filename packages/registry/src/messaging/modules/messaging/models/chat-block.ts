import { model } from "@medusajs/framework/utils"

export const ChatBlock = model
  .define("chat_block", {
    id: model.id({ prefix: "cblk" }).primaryKey(),
    customer_id: model.text(),
    blocked_by: model.text(),
    reason: model.text().nullable(),
  })
  .indexes([
    {
      on: ["customer_id"],
      unique: true,
    },
  ])
