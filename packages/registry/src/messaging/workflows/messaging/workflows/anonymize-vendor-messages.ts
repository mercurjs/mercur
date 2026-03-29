import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"

type AnonymizeVendorInput = {
  seller_id: string
}

const BATCH_SIZE = 100

const anonymizeVendorConversationsStep = createStep(
  "anonymize-vendor-conversations",
  async (input: { seller_id: string }, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    // Paginate to avoid unbounded queries
    const allIds: string[] = []
    let skip = 0

    while (true) {
      const conversations = await service.listConversations(
        { seller_id: input.seller_id },
        { take: BATCH_SIZE, skip, select: ["id"] }
      )

      if (!conversations || conversations.length === 0) break

      const ids = conversations.map((c: { id: string }) => c.id)
      allIds.push(...ids)
      skip += BATCH_SIZE

      if (conversations.length < BATCH_SIZE) break
    }

    // Mark conversations as having a deleted vendor
    // Vendor message bodies are preserved per spec (FR-006)
    for (const id of allIds) {
      await service.updateConversations({
        id,
        seller_id: `deleted_${input.seller_id}`,
      })
    }

    return new StepResponse(
      { conversation_ids: allIds, anonymized_count: allIds.length },
      { conversation_ids: allIds, original_seller_id: input.seller_id }
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    // Restore original seller_id on rollback
    for (const id of compensationData.conversation_ids) {
      await service.updateConversations({
        id,
        seller_id: compensationData.original_seller_id,
      })
    }
  }
)

export const anonymizeVendorMessagesWorkflow = createWorkflow(
  { name: "anonymize-vendor-messages" },
  function (input: AnonymizeVendorInput) {
    const stepInput = transform(input, (data) => ({
      seller_id: data.seller_id,
    }))

    const result = anonymizeVendorConversationsStep(stepInput)

    return new WorkflowResponse(result)
  }
)
