import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { IEventBusModuleService } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { MeilisearchEvents } from '../modules/meilisearch/types'

const CHUNK_SIZE = 100

export default async function meilisearchSellerSuspendedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve<IEventBusModuleService>(Modules.EVENT_BUS)

  try {
    const sellerId = event.data.id

    // Query seller with linked products to get product IDs (bidirectional link)
    const { data: sellers } = await query.graph({
      entity: 'seller',
      fields: ['products.id'],
      filters: { id: sellerId },
    })

    const productIds: string[] =
      (sellers[0] as any)?.products?.map((p: any) => p.id) ?? []

    if (!productIds.length) {
      return
    }

    logger.debug(
      `Meilisearch: Seller ${sellerId} suspended — re-indexing ${productIds.length} products`
    )

    // Emit in chunks so products-changed subscriber processes them in manageable batches
    for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
      const chunk = productIds.slice(i, i + CHUNK_SIZE)
      await eventBus.emit({
        name: MeilisearchEvents.PRODUCTS_CHANGED,
        data: { ids: chunk },
      })
    }
  } catch (error: unknown) {
    logger.error(
      `Meilisearch: Failed to process seller.suspended for seller ${event.data.id}:`,
      error as Error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: 'seller.suspended',
  context: {
    subscriberId: 'meilisearch-seller-suspended-handler',
  },
}
