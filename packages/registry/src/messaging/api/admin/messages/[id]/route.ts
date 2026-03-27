import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { AdminGetMessagesType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetMessagesType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const conversationId = req.params.id!

  // Admin can access any conversation — no ownership check
  const conversations = await service.listConversations(
    { id: conversationId },
    { take: 1 }
  )

  if (!conversations || conversations.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Conversation not found"
    )
  }

  const conversation = conversations[0]!

  const queryParams = (req.validatedQuery ?? {}) as AdminGetMessagesType
  const { data: messages, next_cursor } = await service.listMessagesCursor(
    conversationId,
    {
      cursor: queryParams.cursor,
      limit: queryParams.limit,
    }
  )

  // Resolve buyer + seller names for admin view
  let buyer_name: string | null = null
  let buyer_email: string | null = null
  let seller_name: string | null = null

  try {
    const query = req.scope.resolve("query")

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "first_name", "last_name", "email"],
      filters: { id: conversation.buyer_id },
    })

    if (customers?.length > 0) {
      buyer_name = [customers[0].first_name, customers[0].last_name]
        .filter(Boolean)
        .join(" ")
      buyer_email = customers[0].email
    }

    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "name"],
      filters: { id: conversation.seller_id },
    })

    if (sellers?.length > 0) {
      seller_name = sellers[0].name
    }
  } catch {
    // Continue without enrichment
  }

  res.json({
    conversation: {
      ...conversation,
      buyer_name,
      buyer_email,
      seller_name,
    },
    messages,
    next_cursor,
  })
}
