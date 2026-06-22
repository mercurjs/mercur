import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { sendMessageWorkflow } from "../../../../workflows/messaging/workflows/send-message"
import { VendorGetMessagesType, VendorSendReplyType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetMessagesType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const sellerId = req.auth_context.actor_id
  const conversationId = req.params.id!

  // Verify ownership
  const conversations = await service.listConversations(
    { id: conversationId, seller_id: sellerId },
    { take: 1 }
  )

  if (!conversations || conversations.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Conversation not found"
    )
  }

  const conversation = conversations[0]!

  const queryParams = (req.validatedQuery ?? {}) as VendorGetMessagesType
  const { data: messages, next_cursor } = await service.listMessagesCursor(
    conversationId,
    {
      cursor: queryParams.cursor,
      limit: queryParams.limit,
    }
  )

  // Resolve buyer first name + recent orders for context sidebar
  let buyer_first_name: string | null = null
  let buyer_orders: any[] = []

  try {
    const query = req.scope.resolve("query")

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "first_name"],
      filters: { id: conversation.buyer_id },
    })

    if (customers?.length > 0) {
      buyer_first_name = customers[0].first_name
    }

    // Get recent orders for this buyer, including linked seller to filter
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "status", "total", "currency_code", "created_at", "seller.id"],
      filters: {
        customer_id: conversation.buyer_id,
      },
    })

    // Only include orders that belong to this seller
    buyer_orders = (orders ?? [])
      .filter((o: any) => o.seller?.id === sellerId)
      .map(({ seller, ...rest }: any) => rest)
  } catch {
    // Continue without enrichment
  }

  // Check block status
  const blockedSet = await service.checkBuyersBlocked([conversation.buyer_id])
  const is_buyer_blocked = blockedSet.has(conversation.buyer_id)

  res.json({
    conversation: { ...conversation, buyer_first_name, is_buyer_blocked },
    messages,
    next_cursor,
    buyer_orders,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorSendReplyType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const sellerId = req.auth_context.actor_id
  const conversationId = req.params.id!

  // Verify ownership
  const conversations = await service.listConversations(
    { id: conversationId, seller_id: sellerId },
    { take: 1 }
  )

  if (!conversations || conversations.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Conversation not found"
    )
  }

  const conversation = conversations[0]!

  // Check if buyer is blocked from chat
  const blockedSet = await service.checkBuyersBlocked([conversation.buyer_id])
  if (blockedSet.has(conversation.buyer_id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot send messages to a blocked customer"
    )
  }

  const { body } = req.validatedBody

  const { result: message } = await sendMessageWorkflow.run({
    container: req.scope,
    input: {
      conversation_id: conversationId,
      sender_id: sellerId,
      sender_type: "seller",
      body,
      context_type: null,
      context_id: null,
      context_label: null,
      recipient_id: conversation.buyer_id,
      is_new_conversation: false,
    },
  })

  res.json({ message })
}
