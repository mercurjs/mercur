import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { checkCustomerResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares/check-customer-ownership'
import { storeReviewQueryConfig } from './query-config'
import {
  StoreCreateReview,
  StoreGetReviewsParams,
  StoreUpdateReview
} from './validators'

export const storeReviewMiddlewares: MiddlewareRoute[] = [
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
      ),
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'review'
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/store/reviews/:id',
    middlewares: [
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'review'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/reviews/:id',
    middlewares: [
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreUpdateReview),
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'review'
      })
    ]
  }
]
