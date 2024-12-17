import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import sellerProductLink from '../../../links/seller-product'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { vendorProductQueryConfig } from './query-config'
import {
  VendorCreateProduct,
  VendorGetProductParams,
  VendorUpdateProduct
} from './validators'

export const vendorProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/products',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/products',
    middlewares: [
      validateAndTransformBody(VendorCreateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/products/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/products/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      validateAndTransformBody(VendorUpdateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/products/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      })
    ]
  }
]
