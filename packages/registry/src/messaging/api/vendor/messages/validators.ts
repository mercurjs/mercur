import { z } from "zod"

export type VendorListConversationsType = z.infer<typeof VendorListConversations>
export const VendorListConversations = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export type VendorGetMessagesType = z.infer<typeof VendorGetMessages>
export const VendorGetMessages = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
})

export type VendorSendReplyType = z.infer<typeof VendorSendReply>
export const VendorSendReply = z.object({
  body: z.string().min(1).max(2000),
})

export type VendorMarkReadType = z.infer<typeof VendorMarkRead>
export const VendorMarkRead = z.object({})
