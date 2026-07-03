import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { removeProductAndOffers } from "../modules/search/lib/sync"

export default async function searchProductDeletedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    await removeProductAndOffers(container, [event.data.id])
  } catch (error) {
    logger.error(
      `Search delete failed for product ${event.data.id}:`,
      error as Error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: ["product.deleted", "product.product.deleted"],
  context: {
    subscriberId: "search-product-deleted-handler",
  },
}
