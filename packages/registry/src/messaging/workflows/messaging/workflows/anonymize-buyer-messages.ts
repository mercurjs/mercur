import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { anonymizeMessagesBatchStep } from "../steps/anonymize-messages-batch"

type AnonymizeBuyerInput = {
  buyer_id: string
}

const findBuyerConversationsStep = createStep(
  "find-buyer-conversations",
  async (input: { buyer_id: string }, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    const conversations = await service.listConversations(
      { buyer_id: input.buyer_id },
      { take: 10000, select: ["id"] }
    )

    const ids = (conversations ?? []).map((c: any) => c.id)

    // Update all conversations to reflect deleted buyer
    for (const id of ids) {
      await service.updateConversations({
        id,
        buyer_id: `deleted_${input.buyer_id}`,
      })
    }

    return new StepResponse({ conversation_ids: ids })
  }
)

export const anonymizeBuyerMessagesWorkflow = createWorkflow(
  { name: "anonymize-buyer-messages" },
  function (input: AnonymizeBuyerInput) {
    const findInput = transform(input, (data) => ({
      buyer_id: data.buyer_id,
    }))

    const result = findBuyerConversationsStep(findInput)

    const batchInput = transform(result, (data) => ({
      conversation_ids: data.conversation_ids,
      actor_type: "customer" as const,
      batch_size: 500,
    }))

    const anonymizeResult = anonymizeMessagesBatchStep(batchInput)

    return new WorkflowResponse(anonymizeResult)
  }
)
