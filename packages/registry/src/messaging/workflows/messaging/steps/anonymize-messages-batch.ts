import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"

type AnonymizeBatchInput = {
  conversation_ids: string[]
  actor_type: "customer" | "seller"
  batch_size?: number
}

export const anonymizeMessagesBatchStep = createStep(
  "anonymize-messages-batch",
  async (input: AnonymizeBatchInput, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    const batchSize = input.batch_size ?? 500
    let totalAnonymized = 0

    for (const conversationId of input.conversation_ids) {
      // Paginate through ALL messages sent by the deleted actor
      let hasMore = true
      let skip = 0

      while (hasMore) {
        const messages = await service.listMessages(
          {
            conversation_id: conversationId,
            sender_type: input.actor_type,
          },
          { take: batchSize, skip }
        )

        if (!messages || messages.length === 0) {
          hasMore = false
          break
        }

        const messageIds = messages.map((m: any) => m.id)

        for (const msgId of messageIds) {
          await service.updateMessages({
            id: msgId,
            body: "[Message removed]",
          })
        }

        totalAnonymized += messageIds.length
        skip += batchSize

        // If we got fewer than batchSize, no more pages
        if (messages.length < batchSize) {
          hasMore = false
        }
      }
    }

    return new StepResponse({ anonymized_count: totalAnonymized })
  }
)
