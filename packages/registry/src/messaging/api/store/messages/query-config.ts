export const storeConversationFields = [
  "id",
  "seller_id",
  "last_message_preview",
  "last_message_sender_type",
  "last_message_at",
  "unread_count_customer",
  "created_at",
]

export const storeMessageFields = [
  "id",
  "sender_type",
  "body",
  "context_type",
  "context_id",
  "context_label",
  "read_at",
  "created_at",
]

export const storeMessagingQueryConfig = {
  listConversations: {
    defaults: storeConversationFields,
    isList: true,
  },
  retrieveConversation: {
    defaults: storeConversationFields,
    isList: false,
  },
  listMessages: {
    defaults: storeMessageFields,
    isList: true,
  },
}
