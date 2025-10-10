import {
  MiddlewareRoute,
  maybeApplyLinkFilter,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerProduct from '../../../links/seller-product'
import { filterBySellerId } from '../../../shared/infra/http/middlewares'
import {
  vendorProductCollectionQueryConfig,
  vendorProductCollectionsProductsQueryConfig
} from './query-config'
import {
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
        VendorGetProductCollectionsParams,
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
      filterBySellerId(),
      maybeApplyLinkFilter({
        entryPoint: sellerProduct.entryPoint,
        resourceId: 'product_id',
        filterableField: 'seller_id'
      })
    ]
  }
]
