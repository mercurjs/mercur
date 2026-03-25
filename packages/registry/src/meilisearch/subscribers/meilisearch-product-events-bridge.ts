import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { IEventBusModuleService } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { MeilisearchEvents } from '../modules/meilisearch/types'

export default async function meilisearchProductEventsBridgeHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const eventBus = container.resolve<IEventBusModuleService>(Modules.EVENT_BUS)

  try {
    const isDelete =
      event.name === 'product.product.deleted' ||
      event.name === 'product.deleted'

    await eventBus.emit({
      name: isDelete
        ? MeilisearchEvents.PRODUCTS_DELETED
        : MeilisearchEvents.PRODUCTS_CHANGED,
      data: { ids: [event.data.id] },
    })
  } catch (error: unknown) {
    logger.error(
      `Meilisearch bridge: failed to forward event ${event.name} for product ${event.data.id}:`,
      error as Error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: [
    'product.created',
    'product.updated',
    'product.deleted',
    'product.product.created',
    'product.product.updated',
    'product.product.deleted',
  ],
  context: {
    subscriberId: 'meilisearch-product-events-bridge',
  },
}
