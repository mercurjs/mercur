import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import {
  listTransformQueryConfig,
  storeGetReturnShippingOptionsQueryConfig
} from './query-config'
import {
  StoreGetReturnShippingOptions,
  StoreGetShippingOptions
} from './validators'

export const storeShippingOptionRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/shipping-options',
    middlewares: [
      validateAndTransformQuery(
        StoreGetShippingOptions,
        listTransformQueryConfig
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/store/shipping-options/return',
    middlewares: [
      validateAndTransformQuery(
        StoreGetReturnShippingOptions,
        storeGetReturnShippingOptionsQueryConfig.list
      )
    ]
  }
]
