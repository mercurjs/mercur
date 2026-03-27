import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { markMessagesReadStep } from "../steps/mark-messages-read"
import { publishMessageEventStep } from "../steps/publish-message-event"
import { MarkMessagesReadInput } from "../../../modules/messaging/types/mutations"

type MarkMessagesReadWorkflowInput = MarkMessagesReadInput & {
  sender_id: string
}

export const markMessagesReadWorkflow = createWorkflow(
  { name: "mark-messages-read" },
  function (input: MarkMessagesReadWorkflowInput) {
    const result = markMessagesReadStep(input)

    const readEventInput = transform({ input }, ({ input }) => ({
      conversation_id: input.conversation_id,
      recipient_id: input.sender_id,
      sender_type: input.reader_type,
      event_type: "messages_read" as const,
    }))

    publishMessageEventStep(readEventInput)

    const unreadEventInput = transform({ input }, ({ input }) => ({
      conversation_id: input.conversation_id,
      recipient_id: input.reader_id,
      sender_type: input.reader_type,
      event_type: "unread_count" as const,
      unread_count: 0,
    }))

    ;(publishMessageEventStep(unreadEventInput) as any).config({ name: "publish-unread-count" })

    return new WorkflowResponse(result)
  }
)
