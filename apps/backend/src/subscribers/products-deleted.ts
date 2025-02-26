import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ALGOLIA_MODULE } from '../modules/algolia'
import AlgoliaModuleService from '../modules/algolia/service'
import { AlgoliaEvents, IndexType } from '../modules/algolia/types'

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
    subscriberId: 'products-deleted-handler'
  }
}
