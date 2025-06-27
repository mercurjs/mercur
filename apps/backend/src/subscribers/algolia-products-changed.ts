import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ALGOLIA_MODULE, AlgoliaModuleService } from '@mercurjs/algolia'
import { AlgoliaEvents, IndexType } from '@mercurjs/framework'

import {
  filterProductsByStatus,
  findAndTransformAlgoliaProducts
} from '../subscribers/utils'

export default async function productsChangedHandler({
  event,
  container
}: SubscriberArgs<{ ids: string[] }>) {
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  const { published, other } = await filterProductsByStatus(
    container,
    event.data.ids
  )

  const productsToInsert = published.length
    ? await findAndTransformAlgoliaProducts(container, published)
    : []

  await algolia.batch(IndexType.PRODUCT, productsToInsert, other)
}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.PRODUCTS_CHANGED,
  context: {
    subscriberId: 'algolia-products-changed-handler'
  }
}
