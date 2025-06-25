import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { AlgoliaEvents, IntermediateEvents } from '@mercurjs/framework'

export default async function inventoryItemChangedHandler({
  event,
  container
}: SubscriberArgs<{ id: string | string[] }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const { data: items } = await query.graph({
    entity: 'inventory_item',
    fields: ['variants.product_id'],
    filters: {
      id: event.data.id
    }
  })

  const products = items
    .flatMap((items) => items.variants)
    .map((variant) => variant.product_id)

  await eventBus.emit({
    name: AlgoliaEvents.PRODUCTS_CHANGED,
    data: { ids: [...new Set(products)] }
  })
}

export const config: SubscriberConfig = {
  event: IntermediateEvents.INVENTORY_ITEM_CHANGED,
  context: {
    subscriberId: 'inventory-item-changed-handler'
  }
}
