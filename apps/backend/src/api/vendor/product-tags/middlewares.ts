import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import { vendorProductTagsQueryConfig } from './query-config'
import {
  VendorCreateProductTag,
  VendorGetProductTagsParams
} from './validators'

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
  },
  {
    method: ['POST'],
    matcher: '/vendor/product-tags',
    middlewares: [
      validateAndTransformBody(VendorCreateProductTag),
      validateAndTransformQuery(
        VendorGetProductTagsParams,
        vendorProductTagsQueryConfig.retrieve
      )
    ]
  }
]
