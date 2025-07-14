import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ALGOLIA_MODULE, AlgoliaModuleService } from '@mercurjs/algolia'
import { AlgoliaEvents, IndexType } from '@mercurjs/framework'

/**
 * *
 * Subscriber for event: AlgoliaEvents.PRODUCTS_DELETED. Removes deleted products from the search index.
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function productsDeletedHandler({
  event,
  container
}: SubscriberArgs<{
  ids: string[]
}>) {
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  await algolia.batchDelete(IndexType.PRODUCT, event.data.ids)
}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.PRODUCTS_DELETED,
  context: {
    subscriberId: 'algolia-products-deleted-handler'
  }
}
