import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { vendorStoresQueryConfig } from './query-config'
import { VendorGetStoresParams } from './validators'

export const vendorStoresMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/stores',
    middlewares: [
      validateAndTransformQuery(
        VendorGetStoresParams,
        vendorStoresQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/stores/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetStoresParams,
        vendorStoresQueryConfig.retrieve
      )
    ]
  }
]
