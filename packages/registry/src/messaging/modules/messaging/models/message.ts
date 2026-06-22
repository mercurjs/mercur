import { model } from "@medusajs/framework/utils"
import { Conversation } from "./conversation"

export const Message = model
  .define("message", {
    id: model.id({ prefix: "msg" }).primaryKey(),
    conversation: model.belongsTo(() => Conversation, {
      mappedBy: "messages",
    }),
    sender_id: model.text(),
    sender_type: model.enum(["customer", "seller"]),
    body: model.text(),
    context_type: model.enum(["product", "order"]).nullable(),
    context_id: model.text().nullable(),
    context_label: model.text().nullable(),
    read_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      on: ["conversation_id", "created_at", "id"],
    },
    {
      on: ["context_type", "context_id"],
    },
    {
      on: ["created_at"],
    },
  ])
