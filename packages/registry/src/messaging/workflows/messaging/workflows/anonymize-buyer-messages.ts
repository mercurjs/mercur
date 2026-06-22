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

const BATCH_SIZE = 100

const findBuyerConversationsStep = createStep(
  "find-buyer-conversations",
  async (input: { buyer_id: string }, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    // Paginate to avoid unbounded queries
    const allIds: string[] = []
    let skip = 0

    while (true) {
      const conversations = await service.listConversations(
        { buyer_id: input.buyer_id },
        { take: BATCH_SIZE, skip, select: ["id"] }
      )

      if (!conversations || conversations.length === 0) break

      const ids = conversations.map((c: { id: string }) => c.id)
      allIds.push(...ids)
      skip += BATCH_SIZE

      if (conversations.length < BATCH_SIZE) break
    }

    // Update all conversations to reflect deleted buyer
    for (const id of allIds) {
      await service.updateConversations({
        id,
        buyer_id: `deleted_${input.buyer_id}`,
      })
    }

    return new StepResponse(
      { conversation_ids: allIds },
      { conversation_ids: allIds, original_buyer_id: input.buyer_id }
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    // Restore original buyer_id on rollback
    for (const id of compensationData.conversation_ids) {
      await service.updateConversations({
        id,
        buyer_id: compensationData.original_buyer_id,
      })
    }
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
