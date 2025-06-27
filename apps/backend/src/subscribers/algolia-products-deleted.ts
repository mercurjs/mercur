import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ALGOLIA_MODULE, AlgoliaModuleService } from '@mercurjs/algolia'
import { AlgoliaEvents, IndexType } from '@mercurjs/framework'

export default async function productsDeletedHandler({
  event,
  container
}: SubscriberArgs<{ ids: string[] }>) {
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  await algolia.batchDelete(IndexType.PRODUCT, event.data.ids)
}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.PRODUCTS_DELETED,
  context: {
    subscriberId: 'algolia-products-deleted-handler'
  }
}
