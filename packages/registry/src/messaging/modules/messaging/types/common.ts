export type SenderType = "customer" | "seller"
export type ContextType = "product" | "order"

export interface ConversationDTO {
  id: string
  buyer_id: string
  seller_id: string
  last_message_preview: string | null
  last_message_sender_type: SenderType | null
  last_message_at: Date | string | null
  unread_count_customer: number
  unread_count_seller: number
  created_at: Date | string
  updated_at: Date | string
  deleted_at: Date | string | null
}

export interface MessageDTO {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: SenderType
  body: string
  context_type: ContextType | null
  context_id: string | null
  context_label: string | null
  read_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
  deleted_at: Date | string | null
}

export interface CursorPaginationParams {
  cursor?: string | null
  limit?: number
}

export interface CursorPaginatedResult<T> {
  data: T[]
  next_cursor: string | null
}

export interface StoreConversationResponse {
  conversation: ConversationDTO
}

export type StoreConversationListResponse = {
  conversations: ConversationDTO[]
  next_cursor: string | null
}

export interface StoreMessageResponse {
  message: MessageDTO
}

export type StoreMessageListResponse = {
  messages: MessageDTO[]
  next_cursor: string | null
}

export interface VendorConversationResponse {
  conversation: ConversationDTO
}

export type VendorConversationListResponse = {
  conversations: ConversationDTO[]
  next_cursor: string | null
}

export interface VendorMessageResponse {
  message: MessageDTO
}

export type AdminConversationListResponse = {
  conversations: ConversationDTO[]
  next_cursor: string | null
}

export interface AdminConversationResponse {
  conversation: ConversationDTO
}

export interface ChatBlockDTO {
  id: string
  customer_id: string
  blocked_by: string
  reason: string | null
  created_at: Date | string
  updated_at: Date | string
}

export interface UnreadCountResponse {
  unread_count: number
}

export interface SseTokenResponse {
  token: string
}
