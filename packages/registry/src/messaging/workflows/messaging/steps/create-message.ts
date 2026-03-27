import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { SendMessageInput } from "../../../modules/messaging/types/mutations"

export const createMessageStep = createStep(
  "create-message",
  async (input: SendMessageInput, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    const message = await service.createMessageAtomic({
      conversation_id: input.conversation_id,
      sender_id: input.sender_id,
      sender_type: input.sender_type,
      body: input.body,
      context_type: input.context_type,
      context_id: input.context_id,
      context_label: input.context_label,
    })

    return new StepResponse(message, message.id)
  },
  async (messageId, { container }) => {
    if (!messageId) return

    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    await service.deleteMessages([messageId])
  }
)
