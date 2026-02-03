import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { SellerEvents, StoreStatus, AlgoliaEvents } from '@mercurjs/framework'

import sellerProduct from '../links/seller-product'

export default async function sellerStatusChangedHandler({
  event,
  container
}: SubscriberArgs<{ id: string; store_status: StoreStatus }>) {
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
