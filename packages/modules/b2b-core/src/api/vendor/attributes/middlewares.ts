import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import * as QueryConfig from './query-config'
import { VendorGetAttributesParams } from './validators'

export const vendorAttributeMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/attributes',
    middlewares: [
      validateAndTransformQuery(
        VendorGetAttributesParams,
        QueryConfig.listAttributeQueryConfig
      )
    ]
  },

  {
    method: ['GET'],
    matcher: '/vendor/attributes/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetAttributesParams,
        QueryConfig.retrieveAttributeQueryConfig
      )
    ]
  }
]
