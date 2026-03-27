export const vendorMessagingConversationFields = [
  "id",
  "seller_id",
  "buyer_id",
  "last_message_preview",
  "last_message_sender_type",
  "last_message_at",
  "unread_count_seller",
  "created_at",
  "updated_at",
]

export const vendorMessagingMessageFields = [
  "id",
  "sender_type",
  "body",
  "context_type",
  "context_id",
  "context_label",
  "read_at",
  "created_at",
]

export const vendorMessagingQueryConfig = {
  listConversations: {
    defaults: vendorMessagingConversationFields,
    isList: true,
  },
  listMessages: {
    defaults: vendorMessagingMessageFields,
    isList: true,
  },
}
