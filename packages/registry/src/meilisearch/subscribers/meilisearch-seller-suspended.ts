import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { reindexSellerProducts } from './utils/meilisearch-product'

export default async function meilisearchSellerSuspendedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await reindexSellerProducts(container, event.data.id, 'suspended')
}

export const config: SubscriberConfig = {
  event: 'seller.suspended',
  context: {
    subscriberId: 'meilisearch-seller-suspended-handler',
  },
}
