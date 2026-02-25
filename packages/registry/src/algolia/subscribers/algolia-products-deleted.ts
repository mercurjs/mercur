import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { AlgoliaEvents, IndexType } from '../modules/algolia/types'
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
  } catch (error: unknown) {
    logger.error(
      `Algolia delete failed for products ${event.data.ids.join(', ')}:`,
      error as Error
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
