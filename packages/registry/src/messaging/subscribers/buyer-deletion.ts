import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { anonymizeBuyerMessagesWorkflow } from "../workflows/messaging/workflows/anonymize-buyer-messages"

export default async function buyerDeletionHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    await anonymizeBuyerMessagesWorkflow.run({
      container,
      input: { buyer_id: event.data.id },
    })

    logger.info(
      `Messaging: buyer ${event.data.id} messages anonymized (GDPR erasure)`
    )
  } catch (err) {
    logger.error(
      `Messaging: buyer deletion handler error: ${(err as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "customer.deleted",
}
