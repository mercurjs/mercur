import { z } from 'zod'

import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { ALGOLIA_MODULE } from '../modules/algolia'
import AlgoliaModuleService, {
  defaultProductSettings
} from '../modules/algolia/service'
import { AlgoliaProductValidator, IndexType } from '../modules/algolia/types'

export default async function syncExistingProductsWithAlgolia({
  container
}: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  await algolia.updateSettings(IndexType.PRODUCT, defaultProductSettings)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: [
      '*',
      'categories.name',
      'collection.title ',
      'tags.value',
      'type.value'
    ]
  })

  const productsToInsert = z.array(AlgoliaProductValidator).parse(products)
  const result = await algolia.batchUpsertProduct(productsToInsert)
  console.log(result)
}
