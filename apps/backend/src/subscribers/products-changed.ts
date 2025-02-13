import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { AlgoliaEvents } from '../modules/algolia/types'

export default async function productsChangedHandler({
  event,
  container
}: SubscriberArgs<{ ids: string[] }>) {}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.PRODUCTS_CHANGED,
  context: {
    subscriberId: 'products-changed-handler'
  }
}
