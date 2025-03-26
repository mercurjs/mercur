import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerPromotion from '../../../links/seller-promotion'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { vendorPromotionQueryConfig } from './query-config'
import {
  VendorBatchPromotionRules,
  VendorCreatePromotion,
  VendorGetPromotionsParams
} from './validators'

export const vendorPromotionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/promotions',
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/promotions/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: 'promotion_id'
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/promotions/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: 'promotion_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/promotions',
    middlewares: [
      validateAndTransformBody(VendorCreatePromotion),
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/promotions/:id/buy-rules/batch',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: 'promotion_id'
      }),
      validateAndTransformBody(VendorBatchPromotionRules),
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/promotions/:id/rules/batch',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: 'promotion_id'
      }),
      validateAndTransformBody(VendorBatchPromotionRules),
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/promotions/:id/target-rules/batch',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: 'promotion_id'
      }),
      validateAndTransformBody(VendorBatchPromotionRules),
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      )
    ]
  }
]
