import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import sellerReview from '../../../links/seller-review'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import {
  vendorReviewQueryConfig,
  vendorSellerQueryConfig
} from './query-config'
import {
  VendorCreateSeller,
  VendorGetReviewsParams,
  VendorGetSellerParams,
  VendorUpdateReview,
  VendorUpdateSeller
} from './validators'

export const vendorSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/vendor/sellers',
    middlewares: [
      validateAndTransformBody(VendorCreateSeller),
      validateAndTransformQuery(
        VendorGetSellerParams,
        vendorSellerQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/sellers/me',
    middlewares: [
      validateAndTransformQuery(
        VendorGetSellerParams,
        vendorSellerQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/sellers/me',
    middlewares: [
      validateAndTransformBody(VendorUpdateSeller),
      validateAndTransformQuery(
        VendorGetSellerParams,
        vendorSellerQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/sellers/me/reviews',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/sellers/me/reviews/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReview.entryPoint
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/sellers/me/reviews/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdateReview),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReview.entryPoint
      })
    ]
  }
]
