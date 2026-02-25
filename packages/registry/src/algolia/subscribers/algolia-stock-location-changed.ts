import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { AlgoliaEvents, IntermediateEvents } from '../modules/algolia/types'
import productSellerLink from '@mercurjs/core-plugin/links/product-seller-link'
import stockLocationSellerLink from '@mercurjs/core-plugin/links/stock-location-seller-link'

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
    entity: stockLocationSellerLink.entryPoint,
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
    entity: productSellerLink.entryPoint,
    fields: ['product_id'],
    filters: {
      seller_id: seller.seller_id
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
