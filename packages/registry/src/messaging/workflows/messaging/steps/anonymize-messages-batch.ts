import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
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

        const messageIds = messages.map((m: { id: string }) => m.id)

        for (const msgId of messageIds) {
          await service.updateMessages({
            id: msgId,
            body: "[Message removed]",
          })
        }

        totalAnonymized += messageIds.length
        skip += batchSize

        if (messages.length < batchSize) {
          hasMore = false
        }
      }
    }

    return new StepResponse(
      { anonymized_count: totalAnonymized },
      { conversation_ids: input.conversation_ids, actor_type: input.actor_type, count: totalAnonymized }
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    // Message body anonymization is irreversible — original content is lost.
    // Log for auditability so operators know a partial rollback occurred.
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.warn(
      `Messaging: anonymize-messages-batch compensation triggered for ${compensationData.count} messages ` +
      `in conversations [${compensationData.conversation_ids.join(", ")}]. ` +
      `Message bodies cannot be restored — they were replaced with "[Message removed]".`
    )
  }
)
