import { z } from 'zod'

import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { AlgoliaReviewValidator } from '@mercurjs/framework'

export async function findAndTransformAlgoliaReviews(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: reviews } = await query.graph({
    entity: 'review',
    fields: ['*', 'seller.id', 'product.id'],
    filters: ids.length
      ? {
          id: ids
        }
      : {}
  })

  for (const review of reviews) {
    review.reference_id = review.seller?.id || review.product?.id
  }

  return z.array(AlgoliaReviewValidator).parse(reviews)
}
