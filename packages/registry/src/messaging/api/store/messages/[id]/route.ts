import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { sendMessageWorkflow } from "../../../../workflows/messaging/workflows/send-message"
import { StoreGetMessagesType, StoreSendMessageType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetMessagesType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const customerId = req.auth_context.actor_id
  const conversationId = req.params.id!

  // Verify ownership
  const conversations = await service.listConversations(
    { id: conversationId, buyer_id: customerId },
    { take: 1 }
  )

  if (!conversations || conversations.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Conversation not found"
    )
  }

  const conversation = conversations[0]!

  const queryParams = (req.validatedQuery ?? {}) as StoreGetMessagesType
  const { data: messages, next_cursor } = await service.listMessagesCursor(
    conversationId,
    {
      cursor: queryParams.cursor,
      limit: queryParams.limit,
    }
  )

  res.json({ conversation, messages, next_cursor })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreSendMessageType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const customerId = req.auth_context.actor_id
  const conversationId = req.params.id!

  // Verify ownership
  const conversations = await service.listConversations(
    { id: conversationId, buyer_id: customerId },
    { take: 1 }
  )

  if (!conversations || conversations.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Conversation not found"
    )
  }

  const conversation = conversations[0]!
  const { body, context_type, context_id } = req.validatedBody

  // Resolve context label
  let context_label: string | null = null
  if (context_type === "product" && context_id) {
    try {
      const query = req.scope.resolve("query")
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "title"],
        filters: { id: context_id },
      })
      if (products?.length > 0) {
        context_label = products[0].title
      }
    } catch {
      // continue without label
    }
  } else if (context_type === "order" && context_id) {
    try {
      const query = req.scope.resolve("query")
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "display_id"],
        filters: { id: context_id },
      })
      if (orders?.length > 0) {
        context_label = `Order #${orders[0].display_id}`
      }
    } catch {
      // continue without label
    }
  }

  const { result: message } = await sendMessageWorkflow.run({
    container: req.scope,
    input: {
      conversation_id: conversationId,
      sender_id: customerId,
      sender_type: "customer",
      body,
      context_type: context_type ?? null,
      context_id: context_id ?? null,
      context_label,
      recipient_id: conversation.seller_id,
      is_new_conversation: false,
    },
  })

  res.json({ message })
}
