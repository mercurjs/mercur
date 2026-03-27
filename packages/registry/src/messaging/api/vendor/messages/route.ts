import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { VendorListConversationsType } from "./validators"

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

  // Resolve buyer first names via customer link
  if (conversations.length > 0) {
    try {
      const query = req.scope.resolve("query")
      const buyerIds = [...new Set(conversations.map((c: any) => c.buyer_id))]

      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "first_name"],
        filters: { id: buyerIds },
      })

      const customerMap = new Map(
        (customers ?? []).map((c: any) => [c.id, c.first_name])
      )

      for (const conv of conversations as any[]) {
        conv.buyer_first_name = customerMap.get(conv.buyer_id) ?? null
      }
    } catch {
      // Continue without buyer names
    }
  }

  res.json({ conversations, next_cursor })
}
