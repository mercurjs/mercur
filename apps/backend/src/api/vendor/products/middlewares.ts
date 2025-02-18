import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import sellerProductLink from '../../../links/seller-product'
import { ConfigurationRuleType } from '../../../modules/configuration/types'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { checkConfigurationRule } from '../../../shared/infra/http/middlewares'
import { vendorProductQueryConfig } from './query-config'
import {
  VendorAssignBrandName,
  VendorCreateProduct,
  VendorGetProductParams,
  VendorUpdateProduct
} from './validators'

const canVendorCreateProduct = [
  checkConfigurationRule(ConfigurationRuleType.GLOBAL_PRODUCT_CATALOG, false),
  checkConfigurationRule(ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL, false)
]

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
      ...canVendorCreateProduct,
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
    method: ['POST'],
    matcher: '/vendor/products/:id/brand',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      validateAndTransformBody(VendorAssignBrandName),
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
