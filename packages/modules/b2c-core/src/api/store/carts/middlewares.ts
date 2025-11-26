import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import * as QueryConfig from '@medusajs/medusa/api/store/carts/query-config'
import { StoreAddCartPromotions, StoreGetCartsCart } from '@medusajs/medusa/api/store/carts/validators'
import { StoreAddCartShippingMethods } from '@medusajs/medusa/api/store/carts/validators'

import { StoreDeleteCartShippingMethods } from './validators'

export const storeCartsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/store/carts/:id/shipping-methods',
    middlewares: [
      validateAndTransformBody(StoreAddCartShippingMethods),
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/store/carts/:id/shipping-methods',
    middlewares: [
      validateAndTransformBody(StoreDeleteCartShippingMethods),
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/carts/:id/promotions',
    middlewares: [
      validateAndTransformBody(StoreAddCartPromotions),
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      )
    ]
  }
]
