import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { validateRateLimitStep } from "../steps/validate-rate-limit"
import { validateContentFilterStep } from "../steps/validate-content-filter"
import { createMessageStep } from "../steps/create-message"
import { publishMessageEventStep } from "../steps/publish-message-event"
import { SendMessageInput } from "../../../modules/messaging/types/mutations"

type SendMessageWorkflowInput = SendMessageInput & {
  recipient_id: string
  is_new_conversation: boolean
}

export const sendMessageWorkflow = createWorkflow(
  { name: "send-message" },
  function (input: SendMessageWorkflowInput) {
    const rateLimitInput = transform(input, (data) => ({
      sender_id: data.sender_id,
      is_new_conversation: data.is_new_conversation,
    }))

    validateRateLimitStep(rateLimitInput)

    const filterInput = transform(input, (data) => ({
      body: data.body,
      sender_id: data.sender_id,
      sender_type: data.sender_type,
      conversation_id: data.conversation_id,
    }))

    validateContentFilterStep(filterInput)

    const messageInput = transform(input, (data) => ({
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      sender_type: data.sender_type,
      body: data.body,
      context_type: data.context_type,
      context_id: data.context_id,
      context_label: data.context_label,
    }))

    const message = createMessageStep(messageInput)

    const publishInput = transform({ input, message }, ({ input, message }) => ({
      conversation_id: input.conversation_id,
      recipient_id: input.recipient_id,
      sender_type: input.sender_type,
      event_type: "new_message" as const,
      context_type: input.context_type,
      context_label: input.context_label,
      message_id: message.id,
    }))

    publishMessageEventStep(publishInput)

    const eventData = transform({ input, message }, ({ input, message }) => ({
      eventName: "messaging.message.created",
      data: {
        id: message.id,
        conversation_id: input.conversation_id,
        sender_id: input.sender_id,
        sender_type: input.sender_type,
        recipient_id: input.recipient_id,
      },
    }))

    emitEventStep(eventData)

    return new WorkflowResponse(message)
  }
)
