import {
  MiddlewareRoute,
  maybeApplyLinkFilter,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerProduct from '../../../links/seller-product'
import { filterBySellerId } from '../../../shared/infra/http/middlewares'
import {
  vendorProductCategoryProductsQueryConfig,
  vendorProductCategoryQueryConfig
} from './query-config'
import {
  VendorGetProductCategoriesParams,
  VendorGetProductCategoriesProductsParams
} from './validators'

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
    matcher: '/vendor/product-categories/:id/products',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCategoriesProductsParams,
        vendorProductCategoryProductsQueryConfig.list
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
