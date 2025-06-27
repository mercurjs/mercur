import { ExecArgs } from '@medusajs/framework/types'

import { ALGOLIA_MODULE } from '@mercurjs/algolia'
import {
  AlgoliaModuleService,
  defaultProductSettings,
  defaultReviewSettings
} from '@mercurjs/algolia'
import { IndexType } from '@mercurjs/framework'

import {
  findAndTransformAlgoliaProducts,
  findAndTransformAlgoliaReviews
} from '../subscribers/utils'

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
