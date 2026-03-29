import { z } from "zod"

export type StoreListConversationsType = z.infer<typeof StoreListConversations>
export const StoreListConversations = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export type StoreCreateConversationType = z.infer<typeof StoreCreateConversation>
export const StoreCreateConversation = z.object({
  seller_id: z.string().min(1),
  body: z.string().min(1).max(2000).optional(),
  context_type: z.enum(["product", "order"]).optional().nullable(),
  context_id: z.string().optional().nullable(),
}).refine(
  (data) =>
    (!data.context_type && !data.context_id) ||
    (data.context_type && data.context_id),
  { message: "context_type and context_id must both be set or both be omitted" }
)

export type StoreGetMessagesType = z.infer<typeof StoreGetMessages>
export const StoreGetMessages = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
})

export type StoreSendMessageType = z.infer<typeof StoreSendMessage>
export const StoreSendMessage = z.object({
  body: z.string().min(1).max(2000),
  context_type: z.enum(["product", "order"]).optional().nullable(),
  context_id: z.string().optional().nullable(),
}).refine(
  (data) =>
    (!data.context_type && !data.context_id) ||
    (data.context_type && data.context_id),
  { message: "context_type and context_id must both be set or both be omitted" }
)

export type StoreMarkReadType = z.infer<typeof StoreMarkRead>
export const StoreMarkRead = z.object({})
