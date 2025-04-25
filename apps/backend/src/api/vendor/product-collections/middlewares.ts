import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { vendorProductCollectionQueryConfig } from './query-config'
import { VendorGetProductCollectionsParams } from './validators'

export const vendorProductCollectionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/product-collections',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCollectionsParams,
        vendorProductCollectionQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/product-collections/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCollectionsParams,
        vendorProductCollectionQueryConfig.retrieve
      )
    ]
  }
]
