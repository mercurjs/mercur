import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { retrieveAttributeQueryConfig } from '../attributes/query-config'
import { VendorGetAttributesParams } from '../attributes/validators'
import { vendorProductCategoryQueryConfig } from './query-config'
import { VendorGetProductCategoriesParams } from './validators'

export const vendorProductCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/product-categories',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCategoriesParams,
        vendorProductCategoryQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/product-categories/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCategoriesParams,
        vendorProductCategoryQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/product-categories/:id/attributes',
    middlewares: [
      validateAndTransformQuery(
        VendorGetAttributesParams,
        retrieveAttributeQueryConfig
      )
    ]
  }
]
