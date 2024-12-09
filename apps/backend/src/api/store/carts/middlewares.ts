import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import * as QueryConfig from '@medusajs/medusa/api/store/carts/query-config'
import { StoreGetCartsCart } from '@medusajs/medusa/api/store/carts/validators'
import { StoreAddCartShippingMethods } from '@medusajs/medusa/api/store/carts/validators'

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
  }
]
