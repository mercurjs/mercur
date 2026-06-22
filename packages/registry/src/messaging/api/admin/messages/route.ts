import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { ConversationDTO } from "../../../modules/messaging/types/common"
import { AdminSearchConversationsType } from "./validators"

type AdminEnrichedConversation = ConversationDTO & {
  seller_name?: string | null
  buyer_name?: string | null
  buyer_email?: string | null
  is_buyer_blocked?: boolean
}

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminSearchConversationsType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)

  const {
    cursor,
    limit,
    seller_name,
    buyer_name,
    date_from,
    date_to,
    context_type,
    context_id,
  } = (req.validatedQuery ?? {}) as AdminSearchConversationsType

  const { data: conversations, next_cursor } =
    await service.searchConversationsAdmin(
      {
        seller_name,
        buyer_name,
        date_from,
        date_to,
        context_type,
        context_id,
      },
      { cursor, limit }
    )

  const enriched = conversations as AdminEnrichedConversation[]

  // Annotate block status
  if (enriched.length > 0) {
    const buyerIds = [...new Set(enriched.map((c) => c.buyer_id))]
    const blockedSet = await service.checkBuyersBlocked(buyerIds)
    for (const conv of enriched) {
      conv.is_buyer_blocked = blockedSet.has(conv.buyer_id)
    }
  }

  res.json({ conversations: enriched, next_cursor })
}
