import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { ALGOLIA_MODULE, AlgoliaModuleService } from '@mercurjs/algolia'
import { ReviewDTO } from '@mercurjs/framework'
import {
  AlgoliaEvents,
  AlgoliaReviewValidator,
  IndexType
} from '@mercurjs/framework'
import { getAvgRating } from '@mercurjs/reviews'

import productReview from '../links/product-review'
import sellerReview from '../links/seller-review'

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
    subscriberId: 'algolia-review-changed-handler'
  }
}
