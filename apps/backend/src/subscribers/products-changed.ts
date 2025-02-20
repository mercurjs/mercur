import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ALGOLIA_MODULE } from '../modules/algolia'
import AlgoliaModuleService from '../modules/algolia/service'
import { AlgoliaEvents, IndexType } from '../modules/algolia/types'
import { findAndTransformAlgoliaProducts } from '../modules/algolia/utils'

export default async function productsChangedHandler({
  event,
  container
}: SubscriberArgs<{ ids: string[] }>) {
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  const productsToInsert = await findAndTransformAlgoliaProducts(
    container,
    event.data.ids
  )
  await algolia.batchUpsert(IndexType.PRODUCT, productsToInsert)
}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.PRODUCTS_CHANGED,
  context: {
    subscriberId: 'products-changed-handler'
  }
}
