import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Logger } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { AlgoliaEvents, IndexType } from '@mercurjs/framework'

import { ALGOLIA_MODULE, AlgoliaModuleService } from '../modules/algolia'

export default async function algoliaProductsDeletedHandler({
  event,
  container
}: SubscriberArgs<{ ids: string[] }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

    logger.debug(
      `Algolia sync: Deleting ${event.data.ids.length} products from index`
    )

    await algolia.batchDelete(IndexType.PRODUCT, event.data.ids)

    logger.debug(
      `Algolia sync: Successfully deleted products ${event.data.ids.join(', ')}`
    )
  } catch (error) {
    logger.error(
      `Algolia delete failed for products ${event.data.ids.join(', ')}:`,
      error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.PRODUCTS_DELETED,
  context: {
    subscriberId: 'algolia-products-deleted-handler'
  }
}
