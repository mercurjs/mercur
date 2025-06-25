import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { AlgoliaEvents, IntermediateEvents } from '@mercurjs/framework'

import sellerFulfillmentSet from '../links/seller-fulfillment-set'
import sellerProduct from '../links/seller-product'

export default async function fulfillmentSetChangedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const fulfillment_set_id = event.data.id
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const {
    data: [seller]
  } = await query.graph({
    entity: sellerFulfillmentSet.entryPoint,
    fields: ['seller_id'],
    filters: {
      fulfillment_set_id
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
  event: IntermediateEvents.FULFULLMENT_SET_CHANGED,
  context: {
    subscriberId: 'fulfillment-set-changed-handler'
  }
}
