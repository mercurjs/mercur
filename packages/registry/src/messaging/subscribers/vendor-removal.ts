import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { anonymizeVendorMessagesWorkflow } from "../workflows/messaging/workflows/anonymize-vendor-messages"

export default async function vendorRemovalHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    await anonymizeVendorMessagesWorkflow.run({
      container,
      input: { seller_id: event.data.id },
    })

    logger.info(
      `Messaging: vendor ${event.data.id} conversations anonymized (offboarding)`
    )
  } catch (err) {
    logger.error(
      `Messaging: vendor removal handler error: ${(err as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "seller.deleted",
}
