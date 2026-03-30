import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { MEILISEARCH_MODULE, MeilisearchModuleService } from '../modules/meilisearch'
import { MeilisearchEvents } from '../modules/meilisearch/types'
import {
  filterProductsByStatus,
  findAndTransformMeilisearchProducts,
} from './utils/meilisearch-product'

export default async function meilisearchProductsChangedHandler({
  event,
  container,
}: SubscriberArgs<{ ids: string[] }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const meilisearch =
      container.resolve<MeilisearchModuleService>(MEILISEARCH_MODULE)

    const { published, other } = await filterProductsByStatus(
      container,
      event.data.ids
    )

    logger.debug(
      `Meilisearch sync: Processing ${event.data.ids.length} products — ${published.length} to upsert, ${other.length} to delete`
    )

    const [documentsToUpsert] = await Promise.all([
      published.length
        ? findAndTransformMeilisearchProducts(container, published)
        : Promise.resolve([]),
      other.length
        ? meilisearch.batchDelete(other)
        : Promise.resolve(),
    ])

    if (documentsToUpsert.length) {
      await meilisearch.batchUpsert(documentsToUpsert)
    }

    logger.debug(
      `Meilisearch sync: Successfully synced ${documentsToUpsert.length} products`
    )
  } catch (error: unknown) {
    logger.error(
      `Meilisearch sync failed for products [${event.data.ids.join(', ')}]:`,
      error as Error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: MeilisearchEvents.PRODUCTS_CHANGED,
  context: {
    subscriberId: 'meilisearch-products-changed-handler',
  },
}
