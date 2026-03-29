import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { BlockCustomerInput } from "../../../modules/messaging/types/mutations"

export const blockCustomerStep = createStep(
  "block-customer",
  async (input: BlockCustomerInput, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    const existing = await service.listChatBlocks(
      { customer_id: input.customer_id },
      { take: 1 }
    )

    if (existing.length > 0) {
      return new StepResponse(existing[0], null)
    }

    const [block] = await service.createChatBlocks([
      {
        customer_id: input.customer_id,
        blocked_by: input.blocked_by,
        reason: input.reason ?? null,
      },
    ])

    return new StepResponse(block, block.id)
  },
  async (blockId, { container }) => {
    if (!blockId) return

    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    await service.deleteChatBlocks([blockId])
  }
)
