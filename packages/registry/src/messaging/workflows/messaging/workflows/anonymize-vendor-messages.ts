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

const anonymizeVendorConversationsStep = createStep(
  "anonymize-vendor-conversations",
  async (input: { seller_id: string }, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    const conversations = await service.listConversations(
      { seller_id: input.seller_id },
      { take: 10000, select: ["id"] }
    )

    const ids = (conversations ?? []).map((c: any) => c.id)

    // Mark conversations as having a deleted vendor
    // Vendor message bodies are preserved per spec (FR-006)
    for (const id of ids) {
      await service.updateConversations({
        id,
        seller_id: `deleted_${input.seller_id}`,
      })
    }

    return new StepResponse({
      conversation_ids: ids,
      anonymized_count: ids.length,
    })
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
