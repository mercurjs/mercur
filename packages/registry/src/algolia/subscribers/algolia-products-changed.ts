import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { AlgoliaEvents, IndexType } from '../modules/algolia/types'
import { ALGOLIA_MODULE, AlgoliaModuleService } from '../modules/algolia'
import {
  filterProductsByStatus,
  findAndTransformAlgoliaProducts
} from './utils/algolia-product'

export default async function algoliaProductsChangedHandler({
  event,
  container
}: SubscriberArgs<{ ids: string[] }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

    const { published, other } = await filterProductsByStatus(
      container,
      event.data.ids
    )

    logger.debug(
      `Algolia sync: Processing ${event.data.ids.length} products - ${published.length} to upsert, ${other.length} to delete`
    )

    const productsToInsert = published.length
      ? await findAndTransformAlgoliaProducts(container, published)
      : []

    await algolia.batch(IndexType.PRODUCT, productsToInsert, other)

    logger.debug(
      `Algolia sync: Successfully synced ${productsToInsert.length} products`
    )
  } catch (error: unknown) {
    logger.error(
      `Algolia sync failed for products ${event.data.ids.join(', ')}:`,
      error as Error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.PRODUCTS_CHANGED,
  context: {
    subscriberId: 'algolia-products-changed-handler'
  }
}
