import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { AlgoliaEvents, IntermediateEvents } from '@mercurjs/framework'

import sellerProduct from '../links/seller-product'
import sellerServiceZone from '../links/seller-service-zone'

/**
 * *
 * Subscriber for event: IntermediateEvents.SERVICE_ZONE_CHANGED. Broadcasts product changes to search index on service zone adjustment.
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function serviceZoneChangedHandler({
  event,
  container
}: SubscriberArgs<{
  id: string
}>) {
  const service_zone_id = event.data.id
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const {
    data: [seller]
  } = await query.graph({
    entity: sellerServiceZone.entryPoint,
    fields: ['seller_id'],
    filters: {
      service_zone_id
    },
    withDeleted: true
  })

  if (!seller) {
    return
  }

  const { data: products } = await query.graph({
    entity: sellerProduct.entryPoint,
    fields: ['product_id'],
    filters: {
      seller_id: seller.id
    }
  })

  await eventBus.emit({
    name: AlgoliaEvents.PRODUCTS_CHANGED,
    data: { ids: products.map((p) => p.product_id) }
  })
}

export const config: SubscriberConfig = {
  event: IntermediateEvents.SERVICE_ZONE_CHANGED,
  context: {
    subscriberId: 'service-zone-changed-handler'
  }
}
