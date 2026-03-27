import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

import { createConversationStep } from "../steps/create-conversation"
import { MESSAGING_MODULE } from "../../../modules/messaging"

type CreateConversationWorkflowInput = {
  buyer_id: string
  seller_id: string
}

export const createConversationWorkflow = createWorkflow(
  { name: "create-conversation" },
  function (input: CreateConversationWorkflowInput) {
    const conversation = createConversationStep(input)

    createRemoteLinkStep([
      {
        [Modules.CUSTOMER]: { customer_id: input.buyer_id },
        [MESSAGING_MODULE]: { conversation_id: conversation.id },
      },
      {
        "seller": { seller_id: input.seller_id },
        [MESSAGING_MODULE]: { conversation_id: conversation.id },
      },
    ] as any)

    return new WorkflowResponse(conversation)
  }
)
