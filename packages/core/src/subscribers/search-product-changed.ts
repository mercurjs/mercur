import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { ProductWorkflowEvents } from "../workflows/product/events"
import { reindexProductsById } from "../modules/search/lib/sync"

export default async function searchProductChangedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    await reindexProductsById(container, [event.data.id])
  } catch (error) {
    logger.error(
      `Search sync failed for product ${event.data.id}:`,
      error as Error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: [
    ProductWorkflowEvents.PUBLISHED,
    ProductWorkflowEvents.REJECTED,
    "product.updated",
    "product.product.updated",
  ],
  context: {
    subscriberId: "search-product-changed-handler",
  },
}
