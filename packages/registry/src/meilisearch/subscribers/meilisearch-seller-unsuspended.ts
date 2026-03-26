import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { reindexSellerProducts } from './utils/meilisearch-product'

export default async function meilisearchSellerUnsuspendedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await reindexSellerProducts(container, event.data.id, 'unsuspended')
}

export const config: SubscriberConfig = {
  event: 'seller.unsuspended',
  context: {
    subscriberId: 'meilisearch-seller-unsuspended-handler',
  },
}
