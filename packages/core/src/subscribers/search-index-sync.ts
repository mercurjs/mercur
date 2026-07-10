import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { OfferWorkflowEvents, SellerWorkflowEvents } from "../workflows/events"
import { ProductWorkflowEvents } from "../workflows/product/events"
import {
  resolveProductIds,
  syncSearchProducts,
} from "../utils/search/sync-search-products"

export default async function searchIndexSyncHandler({
  event,
  container,
}: SubscriberArgs<unknown>) {
  const productIds = await resolveProductIds(container, event.name, event.data)
  await syncSearchProducts(container, productIds)
}

export const config: SubscriberConfig = {
  event: [
    OfferWorkflowEvents.CREATED,
    OfferWorkflowEvents.UPDATED,
    OfferWorkflowEvents.DELETED,
    ProductWorkflowEvents.PUBLISHED,
    ProductWorkflowEvents.REJECTED,
    SellerWorkflowEvents.UPDATED,
    SellerWorkflowEvents.SUSPENDED,
    SellerWorkflowEvents.UNSUSPENDED,
    SellerWorkflowEvents.APPROVED,
    SellerWorkflowEvents.TERMINATED,
    SellerWorkflowEvents.UNTERMINATED,
    SellerWorkflowEvents.DELETED,
  ],
  context: {
    subscriberId: "search-index-sync",
  },
}
