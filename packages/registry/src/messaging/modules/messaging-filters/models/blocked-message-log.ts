import { model } from "@medusajs/framework/utils"

export const BlockedMessageLog = model.define("blocked_message_log", {
  id: model.id({ prefix: "bml" }).primaryKey(),
  sender_id: model.text(),
  sender_type: model.enum(["customer", "seller"]),
  conversation_id: model.text(),
  matched_rule_id: model.text(),
  message_body: model.text(),
})
