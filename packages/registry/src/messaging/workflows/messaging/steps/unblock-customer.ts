import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { UnblockCustomerInput } from "../../../modules/messaging/types/mutations"

export const unblockCustomerStep = createStep(
  "unblock-customer",
  async (input: UnblockCustomerInput, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    const existing = await service.listChatBlocks(
      { customer_id: input.customer_id },
      { take: 1 }
    )

    if (existing.length === 0) {
      return new StepResponse(null, null)
    }

    await service.deleteChatBlocks([existing[0].id])
    return new StepResponse(null, existing[0])
  },
  async (deletedBlock: any, { container }) => {
    if (!deletedBlock) return

    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    await service.createChatBlocks([
      {
        customer_id: deletedBlock.customer_id,
        blocked_by: deletedBlock.blocked_by,
        reason: deletedBlock.reason,
      },
    ])
  }
)
