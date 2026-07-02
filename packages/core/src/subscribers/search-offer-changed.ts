import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { OfferWorkflowEvents } from "../workflows/events"
import {
  reindexProductsById,
  removeOfferDocs,
} from "../modules/search/lib/sync"

export default async function searchOfferChangedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; product_id?: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { id, product_id } = event.data

  try {
    if (event.name === OfferWorkflowEvents.DELETED) {
      await removeOfferDocs(container, [id])
    }
    if (product_id) {
      await reindexProductsById(container, [product_id])
    }
  } catch (error) {
    logger.error(`Search sync failed for offer ${id}:`, error as Error)
    throw error
  }
}

export const config: SubscriberConfig = {
  event: [
    OfferWorkflowEvents.CREATED,
    OfferWorkflowEvents.UPDATED,
    OfferWorkflowEvents.DELETED,
  ],
  context: {
    subscriberId: "search-offer-changed-handler",
  },
}
