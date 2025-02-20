import { z } from 'zod'

import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { ALGOLIA_MODULE } from '../modules/algolia'
import AlgoliaModuleService, {
  defaultProductSettings,
  defaultReviewSettings
} from '../modules/algolia/service'
import { AlgoliaProductValidator, IndexType } from '../modules/algolia/types'

export default async function syncExistingProductsWithAlgolia({
  container
}: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  await algolia.updateSettings(IndexType.PRODUCT, defaultProductSettings)
  await algolia.updateSettings(IndexType.REVIEW, defaultReviewSettings)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: [
      '*',
      'categories.name',
      'collection.title ',
      'tags.value',
      'type.value',
      'variants.*',
      'brand.name'
    ]
  })

  const productsToInsert = z.array(AlgoliaProductValidator).parse(products)
  const result = await algolia.batchUpsert(IndexType.PRODUCT, productsToInsert)
  console.log(result)
}
