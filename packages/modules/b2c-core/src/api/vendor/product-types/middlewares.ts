import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { vendorProductTypeQueryConfig } from './query-config'
import { VendorGetProductTypesParams } from './validators'

export const vendorProductTypesMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/product-types',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTypesParams,
        vendorProductTypeQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/product-types/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTypesParams,
        vendorProductTypeQueryConfig.retrieve
      )
    ]
  }
]
