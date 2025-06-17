import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

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
  }
]
