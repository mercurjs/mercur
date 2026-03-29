import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"

type ValidateChatBlockInput = {
  sender_id: string
  sender_type: "customer" | "seller"
  recipient_id: string
}

export const validateChatBlockStep = createStep(
  "validate-chat-block",
  async (input: ValidateChatBlockInput, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    const customerId =
      input.sender_type === "customer" ? input.sender_id : input.recipient_id
    const blocked = await service.checkBuyersBlocked([customerId])

    if (blocked.has(customerId)) {
      if (input.sender_type === "customer") {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Your chat access has been suspended"
        )
      } else {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Cannot send messages to a blocked customer"
        )
      }
    }

    return new StepResponse(undefined)
  }
)
