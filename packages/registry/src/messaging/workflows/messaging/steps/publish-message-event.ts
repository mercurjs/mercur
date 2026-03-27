import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_REDIS_MODULE } from "../../../modules/messaging-redis"
import type MessagingRedisModuleService from "../../../modules/messaging-redis/service"
import { PublishMessageEventInput } from "../../../modules/messaging/types/mutations"

export const publishMessageEventStep = createStep(
  "publish-message-event",
  async (input: PublishMessageEventInput, { container }) => {
    try {
      const redisService = container.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)

      await redisService.publish("messaging", {
        conversation_id: input.conversation_id,
        recipient_id: input.recipient_id,
        sender_type: input.sender_type,
        event_type: input.event_type,
        context_type: input.context_type ?? null,
        context_label: input.context_label ?? null,
        message_id: input.message_id ?? null,
        unread_count: input.unread_count ?? null,
      })
    } catch {
      // Redis publish is best-effort — client catches up via Last-Event-ID
    }

    return new StepResponse(undefined)
  }
)
