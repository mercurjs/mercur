import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { storeReviewQueryConfig } from './query-config'
import { StoreCreateReview, StoreGetReviewsParams } from './validators'

export const reviewMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/reviews',
    middlewares: [
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/reviews',
    middlewares: [
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreCreateReview)
    ]
  },
  {
    method: ['GET'],
    matcher: '/store/reviews/:id',
    middlewares: [
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      )
    ]
  }
]
