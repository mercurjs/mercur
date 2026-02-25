import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { AlgoliaEvents, IntermediateEvents } from '../modules/algolia/types'
import productSellerLink from '@mercurjs/core-plugin/links/product-seller-link'
import shippingOptionSellerLink from '@mercurjs/core-plugin/links/shipping-option-seller-link'

export default async function shippingOptionChangedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const shipping_option_id = event.data.id
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const {
    data: [seller]
  } = await query.graph({
    entity: shippingOptionSellerLink.entryPoint,
    fields: ['seller_id'],
    filters: {
      shipping_option_id
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
  event: IntermediateEvents.SHIPPING_OPTION_CHANGED,
  context: {
    subscriberId: 'shipping-option-changed-handler'
  }
}
