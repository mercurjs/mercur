import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import customerWishlist from '../../../links/customer-wishlist'
import { checkCustomerResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares/check-customer-ownership'
import { storeWishlistQueryConfig } from './query-config'
import { StoreCreateWishlist, StoreGetWishlistsParams } from './validators'

export const storeWishlistMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/wishlist',
    middlewares: [
      validateAndTransformQuery(
        StoreGetWishlistsParams,
        storeWishlistQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/wishlist',
    middlewares: [
      validateAndTransformQuery(
        StoreGetWishlistsParams,
        storeWishlistQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreCreateWishlist)
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/store/wishlist/:id/product/:reference_id',
    middlewares: [
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: customerWishlist.entryPoint,
        filterField: 'wishlist_id'
      })
    ]
  }
]
