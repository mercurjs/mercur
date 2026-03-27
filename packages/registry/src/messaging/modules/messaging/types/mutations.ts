import { ContextType, SenderType } from "./common"

export interface CreateConversationInput {
  buyer_id: string
  seller_id: string
}

export interface SendMessageInput {
  conversation_id: string
  sender_id: string
  sender_type: SenderType
  body: string
  context_type?: ContextType | null
  context_id?: string | null
  context_label?: string | null
}

export interface MarkMessagesReadInput {
  conversation_id: string
  reader_id: string
  reader_type: SenderType
}

export interface PublishMessageEventInput {
  conversation_id: string
  recipient_id: string
  sender_type: SenderType
  event_type: "new_message" | "messages_read" | "unread_count"
  context_type?: string | null
  context_label?: string | null
  message_id?: string
  unread_count?: number
}
