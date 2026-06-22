import { model } from "@medusajs/framework/utils"

export const Conversation = model
  .define("conversation", {
    id: model.id({ prefix: "conv" }).primaryKey(),
    buyer_id: model.text(),
    seller_id: model.text(),
    last_message_preview: model.text().nullable(),
    last_message_sender_type: model.enum(["customer", "seller"]).nullable(),
    last_message_at: model.dateTime().nullable(),
    unread_count_customer: model.number().default(0),
    unread_count_seller: model.number().default(0),
    messages: model.hasMany(() => Message, { mappedBy: "conversation" }),
  })
  .indexes([
    {
      on: ["buyer_id", "seller_id"],
      unique: true,
    },
    {
      on: ["seller_id", "last_message_at", "id"],
    },
    {
      on: ["buyer_id", "last_message_at", "id"],
    },
  ])

import { Message } from "./message"
