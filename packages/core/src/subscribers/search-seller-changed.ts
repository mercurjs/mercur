import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { SellerWorkflowEvents } from "../workflows/events"
import {
  offersForSeller,
  reindexProductsById,
  removeOfferDocs,
} from "../modules/search/lib/sync"

// unterminated lands on SUSPENDED, still not OPEN, so its offers stay dropped.
const DEACTIVATING = new Set<string>([
  SellerWorkflowEvents.SUSPENDED,
  SellerWorkflowEvents.TERMINATED,
  SellerWorkflowEvents.UNTERMINATED,
  SellerWorkflowEvents.DELETED,
])

export default async function searchSellerChangedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const sellerId = event.data.id

  try {
    const { offerIds, productIds } = await offersForSeller(container, sellerId)

    if (DEACTIVATING.has(event.name)) {
      await removeOfferDocs(container, offerIds)
    }
    await reindexProductsById(container, productIds)
  } catch (error) {
    logger.error(
      `Search sync failed for seller ${sellerId} (${event.name}):`,
      error as Error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: [
    SellerWorkflowEvents.APPROVED,
    SellerWorkflowEvents.UNSUSPENDED,
    SellerWorkflowEvents.UPDATED,
    SellerWorkflowEvents.SUSPENDED,
    SellerWorkflowEvents.TERMINATED,
    SellerWorkflowEvents.UNTERMINATED,
    SellerWorkflowEvents.DELETED,
  ],
  context: {
    subscriberId: "search-seller-changed-handler",
  },
}
