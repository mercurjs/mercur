import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { filterBySellerId } from '../../../shared/infra/http/middlewares'
import {
  vendorProductCollectionQueryConfig,
  vendorProductCollectionsProductsQueryConfig
} from './query-config'
import {
  VendorGetProductCollectionParams,
  VendorGetProductCollectionsParams,
  VendorGetProductCollectionsProductsParams
} from './validators'

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
        VendorGetProductCollectionParams,
        vendorProductCollectionQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/product-collections/:id/products',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCollectionsProductsParams,
        vendorProductCollectionsProductsQueryConfig.list
      ),
      filterBySellerId()
    ]
  }
]
