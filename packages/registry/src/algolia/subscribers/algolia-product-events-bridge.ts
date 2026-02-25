import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { IEventBusModuleService } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  Modules,
} from '@medusajs/framework/utils'

import { AlgoliaEvents } from '../modules/algolia/types'

export default async function algoliaProductEventsBridgeHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const eventBus = container.resolve<IEventBusModuleService>(Modules.EVENT_BUS)

  logger.info(`Algolia bridge: received event ${event.name} with data ${JSON.stringify(event.data)}`)

  const isDelete = event.name === 'product.product.deleted' || event.name === 'product.deleted'

  await eventBus.emit({
    name: isDelete
      ? AlgoliaEvents.PRODUCTS_DELETED
      : AlgoliaEvents.PRODUCTS_CHANGED,
    data: { ids: [event.data.id] },
  })
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
    subscriberId: 'algolia-product-events-bridge'
  }
}
