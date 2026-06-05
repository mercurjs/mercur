import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { MEILISEARCH_MODULE, MeilisearchModuleService } from '../modules/meilisearch'
import { MeilisearchEvents } from '../modules/meilisearch/types'

export default async function meilisearchProductsDeletedHandler({
  event,
  container,
}: SubscriberArgs<{ ids: string[] }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const meilisearch =
      container.resolve<MeilisearchModuleService>(MEILISEARCH_MODULE)

    logger.debug(
      `Meilisearch delete: Removing ${event.data.ids.length} products from index`
    )

    await meilisearch.batchDelete(event.data.ids)

    logger.debug(
      `Meilisearch delete: Successfully removed ${event.data.ids.length} products`
    )
  } catch (error: unknown) {
    logger.error(
      `Meilisearch delete failed for products [${event.data.ids.join(', ')}]:`,
      error as Error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: MeilisearchEvents.PRODUCTS_DELETED,
  context: {
    subscriberId: 'meilisearch-products-deleted-handler',
  },
}
