import { ExecArgs } from '@medusajs/framework/types'

import { ALGOLIA_MODULE } from '../modules/algolia'
import AlgoliaModuleService, {
  defaultProductSettings,
  defaultReviewSettings
} from '../modules/algolia/service'
import { IndexType } from '../modules/algolia/types'
import {
  findAndTransformAlgoliaProducts,
  findAndTransformAlgoliaReviews
} from '../modules/algolia/utils'

export default async function syncExistingProductsWithAlgolia({
  container
}: ExecArgs) {
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  await algolia.updateSettings(IndexType.PRODUCT, defaultProductSettings)
  await algolia.updateSettings(IndexType.REVIEW, defaultReviewSettings)

  const productsToInsert = await findAndTransformAlgoliaProducts(container)
  const productResult = await algolia.batchUpsert(
    IndexType.PRODUCT,
    productsToInsert
  )

  const reviewsToInsert = await findAndTransformAlgoliaReviews(container)
  const reviewResult = await algolia.batchUpsert(
    IndexType.REVIEW,
    reviewsToInsert
  )

  console.log(
    `Inserted ${productResult.objectIDs.length} products and ${reviewResult.objectIDs.length} reviews!`
  )
}
