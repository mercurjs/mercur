import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { createConversationWorkflow } from "../../../workflows/messaging/workflows/create-conversation"
import { sendMessageWorkflow } from "../../../workflows/messaging/workflows/send-message"
import { resolveContextLabel } from "./helpers"
import {
  StoreCreateConversationType,
  StoreListConversationsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreListConversationsType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const customerId = req.auth_context.actor_id

  const queryParams = (req.validatedQuery ?? {}) as StoreListConversationsType
  const { data: conversations, next_cursor } =
    await service.listConversationsCursor(
      { buyer_id: customerId },
      {
        cursor: queryParams.cursor,
        limit: queryParams.limit,
      }
    )

  res.json({ conversations, next_cursor })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateConversationType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id
  const { seller_id, body, context_type, context_id } = req.validatedBody

  // Check if buyer is blocked from chat
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const blocked = await service.checkBuyersBlocked([customerId])
  if (blocked.has(customerId)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Your chat access has been suspended"
    )
  }

  // Check if seller exists and is active
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "name"],
    filters: { id: seller_id },
  })

  if (!sellers || sellers.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Seller not found"
    )
  }

  // Find or create conversation
  let conversation: any
  const existing = await service.listConversations(
    { buyer_id: customerId, seller_id },
    { take: 1 }
  )

  if (existing && existing.length > 0) {
    conversation = existing[0]
  } else {
    const { result } = await createConversationWorkflow.run({
      container: req.scope,
      input: { buyer_id: customerId, seller_id },
    })
    conversation = result
  }

  let message
  if (body) {
    // Resolve context label for display
    const context_label = await resolveContextLabel(req.scope, context_type ?? null, context_id ?? null)

    const { result } = await sendMessageWorkflow.run({
      container: req.scope,
      input: {
        conversation_id: conversation.id,
        sender_id: customerId,
        sender_type: "customer",
        body,
        context_type: context_type ?? null,
        context_id: context_id ?? null,
        context_label,
        recipient_id: seller_id,
        is_new_conversation: existing.length === 0,
      },
    })
    message = result
  }

  const response: any = { conversation }
  if (message) {
    response.message = message
  }

  res.status(200).json(response)
}
