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
  vendorOnboardingQueryConfig,
  vendorReviewQueryConfig,
  vendorSellerQueryConfig
} from './query-config'
import {
  VendorCreateSeller,
  VendorGetOnboardingParams,
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
    method: ['GET', 'POST'],
    matcher: '/vendor/sellers/me/onboarding',
    middlewares: [
      validateAndTransformQuery(
        VendorGetOnboardingParams,
        vendorOnboardingQueryConfig.retrieve
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
        entryPoint: sellerReview.entryPoint,
        filterField: 'review_id'
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
        entryPoint: sellerReview.entryPoint,
        filterField: 'review_id'
      })
    ]
  }
]
