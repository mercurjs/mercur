import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { ConversationDTO } from "../../../modules/messaging/types/common"
import { VendorListConversationsType } from "./validators"

type EnrichedConversation = ConversationDTO & {
  buyer_first_name?: string | null
  is_buyer_blocked?: boolean
}

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorListConversationsType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const sellerId = req.auth_context.actor_id

  const { data: conversations, next_cursor } =
    await service.listConversationsCursor(
      { seller_id: sellerId },
      {
        cursor: (req.validatedQuery as VendorListConversationsType)?.cursor,
        limit: (req.validatedQuery as VendorListConversationsType)?.limit,
      }
    )

  const enriched = conversations as EnrichedConversation[]

  // Resolve buyer first names via customer link
  if (enriched.length > 0) {
    try {
      const query = req.scope.resolve("query")
      const buyerIds = [...new Set(enriched.map((c) => c.buyer_id))]

      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "first_name"],
        filters: { id: buyerIds },
      })

      const customerMap = new Map(
        (customers ?? []).map((c: { id: string; first_name: string }) => [c.id, c.first_name])
      )

      for (const conv of enriched) {
        conv.buyer_first_name = customerMap.get(conv.buyer_id) ?? null
      }
    } catch {
      // Continue without buyer names
    }
  }

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
