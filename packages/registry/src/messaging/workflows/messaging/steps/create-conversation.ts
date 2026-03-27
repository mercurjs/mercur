import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { CreateConversationInput } from "../../../modules/messaging/types/mutations"

export const createConversationStep = createStep(
  "create-conversation",
  async (input: CreateConversationInput, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    const conversation = await service.createConversations({
      buyer_id: input.buyer_id,
      seller_id: input.seller_id,
    })

    return new StepResponse(conversation, conversation.id)
  },
  async (conversationId, { container }) => {
    if (!conversationId) return

    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    await service.deleteConversations([conversationId])
  }
)
