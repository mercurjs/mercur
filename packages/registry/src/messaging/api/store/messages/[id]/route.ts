import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { sendMessageWorkflow } from "../../../../workflows/messaging/workflows/send-message"
import { resolveContextLabel } from "../helpers"
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

  // Check if buyer is blocked from chat
  const blocked = await service.checkBuyersBlocked([customerId])
  if (blocked.has(customerId)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Your chat access has been suspended"
    )
  }

  const { body, context_type, context_id } = req.validatedBody

  // Resolve context label for display
  const context_label = await resolveContextLabel(req.scope, context_type ?? null, context_id ?? null)

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
