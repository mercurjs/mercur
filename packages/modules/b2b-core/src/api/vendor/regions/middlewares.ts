import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { vendorRegionsQueryConfig } from './query-config'
import { VendorGetRegionsParams } from './validators'

export const vendorRegionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/regions',
    middlewares: [
      validateAndTransformQuery(
        VendorGetRegionsParams,
        vendorRegionsQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/regions/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetRegionsParams,
        vendorRegionsQueryConfig.retrieve
      )
    ]
  }
]
