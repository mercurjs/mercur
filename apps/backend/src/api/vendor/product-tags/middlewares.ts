import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { vendorProductTagsQueryConfig } from './query-config'
import { VendorGetProductTagsParams } from './validators'

export const vendorProductTagsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/product-tags',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTagsParams,
        vendorProductTagsQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/product-tags/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTagsParams,
        vendorProductTagsQueryConfig.retrieve
      )
    ]
  }
]
