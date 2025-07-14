import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { SellerEvents, StoreStatus } from '@mercurjs/framework'
import { AlgoliaEvents } from '@mercurjs/framework'

import sellerProduct from '../links/seller-product'

/**
 * *
 * Subscriber for event: SellerEvents.STORE_STATUS_CHANGED. Broadcasts store status updates to product indexing system.
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function sellerStatusChangedHandler({
  event,
  container
}: SubscriberArgs<{
  id: string
  store_status: StoreStatus
}>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const { data: products } = await query.graph({
    entity: sellerProduct.entryPoint,
    fields: ['product_id'],
    filters: {
      seller_id: event.data.id
    }
  })

  if (!products.length) {
    return
  }

  await eventBus.emit({
    name: AlgoliaEvents.PRODUCTS_CHANGED,
    data: {
      ids: products.map((p) => p.product_id)
    }
  })
}

export const config: SubscriberConfig = {
  event: SellerEvents.STORE_STATUS_CHANGED,
  context: {
    subscriberId: 'seller-store-status-changed-handler'
  }
}
