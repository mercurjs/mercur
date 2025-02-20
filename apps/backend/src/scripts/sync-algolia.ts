import { ExecArgs } from '@medusajs/framework/types'

import { ALGOLIA_MODULE } from '../modules/algolia'
import AlgoliaModuleService, {
  defaultProductSettings,
  defaultReviewSettings
} from '../modules/algolia/service'
import { IndexType } from '../modules/algolia/types'
import { findAndTransformAlgoliaProducts } from '../modules/algolia/utils'

export default async function syncExistingProductsWithAlgolia({
  container
}: ExecArgs) {
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  await algolia.updateSettings(IndexType.PRODUCT, defaultProductSettings)
  await algolia.updateSettings(IndexType.REVIEW, defaultReviewSettings)

  const productsToInsert = await findAndTransformAlgoliaProducts(container)
  const result = await algolia.batchUpsert(IndexType.PRODUCT, productsToInsert)
  console.log(result)
}
