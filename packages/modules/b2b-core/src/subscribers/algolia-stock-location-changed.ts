import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { AlgoliaEvents, IntermediateEvents } from '@mercurjs/framework'

import sellerProduct from '../links/seller-product'
import sellerStockLocation from '../links/seller-stock-location'

export default async function stockLocationChangedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const stock_location_id = event.data.id
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const {
    data: [seller]
  } = await query.graph({
    entity: sellerStockLocation.entryPoint,
    fields: ['seller_id'],
    filters: {
      stock_location_id
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
  event: IntermediateEvents.STOCK_LOCATION_CHANGED,
  context: {
    subscriberId: 'stock-location-changed-handler'
  }
}
