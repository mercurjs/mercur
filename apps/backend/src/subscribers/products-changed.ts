import { z } from 'zod'

import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { ALGOLIA_MODULE } from '../modules/algolia'
import AlgoliaModuleService from '../modules/algolia/service'
import {
  AlgoliaEvents,
  AlgoliaProductValidator
} from '../modules/algolia/types'

export default async function productsChangedHandler({
  event,
  container
}: SubscriberArgs<{ ids: string[] }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: [
      '*',
      'categories.name',
      'collection.title ',
      'tags.value',
      'type.value',
      'variants.*'
    ],
    filters: {
      id: event.data.ids
    }
  })

  const productsToInsert = z.array(AlgoliaProductValidator).parse(products)
  await algolia.batchUpsertProduct(productsToInsert)
}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.PRODUCTS_CHANGED,
  context: {
    subscriberId: 'products-changed-handler'
  }
}
