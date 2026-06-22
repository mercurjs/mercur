import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { MarkMessagesReadInput } from "../../../modules/messaging/types/mutations"

export const markMessagesReadStep = createStep(
  "mark-messages-read",
  async (input: MarkMessagesReadInput, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    const updated = await service.markMessagesReadAtomic(
      input.conversation_id,
      input.reader_type
    )

    return new StepResponse({ conversation_id: input.conversation_id, updated })
  }
)
