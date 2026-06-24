export const adminMessagingConversationFields = [
  "id",
  "buyer_id",
  "seller_id",
  "buyer_name",
  "buyer_email",
  "seller_name",
  "last_message_preview",
  "last_message_sender_type",
  "last_message_at",
  "unread_count_customer",
  "unread_count_seller",
  "created_at",
  "updated_at",
]

export const adminMessagingMessageFields = [
  "id",
  "sender_id",
  "sender_type",
  "body",
  "context_type",
  "context_id",
  "context_label",
  "read_at",
  "created_at",
]

export const adminMessagingQueryConfig = {
  listConversations: {
    defaults: adminMessagingConversationFields,
    isList: true,
  },
  listMessages: {
    defaults: adminMessagingMessageFields,
    isList: true,
  },
}
