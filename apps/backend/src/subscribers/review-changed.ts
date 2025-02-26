import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import productReview from '../links/product-review'
import sellerReview from '../links/seller-review'
import { ALGOLIA_MODULE } from '../modules/algolia'
import AlgoliaModuleService from '../modules/algolia/service'
import {
  AlgoliaEvents,
  AlgoliaReviewValidator,
  IndexType
} from '../modules/algolia/types'
import { ReviewDTO } from '../modules/reviews/types'
import { getAvgRating } from '../modules/reviews/utils'

export default async function reviewChangedHandler({
  event,
  container
}: SubscriberArgs<{ review: ReviewDTO }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  const { review } = event.data

  if (review.reference === 'product') {
    const {
      data: [relation]
    } = await query.graph({
      entity: productReview.entryPoint,
      fields: ['product_id'],
      filters: {
        review_id: review.id
      }
    })

    const average_rating = await getAvgRating(
      container,
      review.reference,
      relation.product_id
    )

    await algolia.partialUpdate(IndexType.PRODUCT, {
      id: relation.product_id,
      average_rating: Number(average_rating)
    })

    await algolia.upsert(
      IndexType.REVIEW,
      AlgoliaReviewValidator.parse({
        ...review,
        reference_id: relation.product_id
      })
    )
  }

  if (review.reference === 'seller') {
    const {
      data: [relation]
    } = await query.graph({
      entity: sellerReview.entryPoint,
      fields: ['seller_id'],
      filters: {
        review_id: review.id
      }
    })

    await algolia.upsert(
      IndexType.REVIEW,
      AlgoliaReviewValidator.parse({
        ...review,
        reference_id: relation.seller_id
      })
    )
  }
}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.REVIEW_CHANGED,
  context: {
    subscriberId: 'review-changed-handler'
  }
}
