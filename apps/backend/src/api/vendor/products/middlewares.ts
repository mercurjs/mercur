import multer from 'multer'

import {
  unlessPath,
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
  CreateProductOption,
  CreateProductVariant,
  UpdateProductOption,
  UpdateProductVariant,
  VendorAssignBrandName,
  VendorCreateProduct,
  VendorGetProductParams,
  VendorUpdateProduct,
  VendorUpdateProductStatus
} from './validators'

const canVendorCreateProduct = [
  checkConfigurationRule(ConfigurationRuleType.GLOBAL_PRODUCT_CATALOG, false),
  checkConfigurationRule(ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL, false)
]

const upload = multer({ storage: multer.memoryStorage() })

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
    method: ['POST'],
    matcher: '/vendor/products/export',
    middlewares: []
  },
  {
    method: ['POST'],
    matcher: '/vendor/products/import',
    middlewares: [
      checkConfigurationRule(
        ConfigurationRuleType.PRODUCT_IMPORT_ENABLED,
        true
      ),
      upload.single('file')
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/products/:id',
    middlewares: [
      unlessPath(
        /.*\/products\/(export|import)/,
        checkResourceOwnershipByResourceId({
          entryPoint: sellerProductLink.entryPoint,
          filterField: 'product_id'
        })
      ),
      unlessPath(
        /.*\/products\/(export|import)/,
        validateAndTransformQuery(
          VendorGetProductParams,
          vendorProductQueryConfig.retrieve
        )
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/products/:id',
    middlewares: [
      unlessPath(
        /.*\/products\/(export|import)/,
        checkResourceOwnershipByResourceId({
          entryPoint: sellerProductLink.entryPoint,
          filterField: 'product_id'
        })
      ),
      unlessPath(
        /.*\/products\/(export|import)/,
        validateAndTransformBody(VendorUpdateProduct)
      ),
      unlessPath(
        /.*\/products\/(export|import)/,
        validateAndTransformQuery(
          VendorGetProductParams,
          vendorProductQueryConfig.retrieve
        )
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
    method: ['POST'],
    matcher: '/vendor/products/:id/variants',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      validateAndTransformBody(CreateProductVariant),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/products/:id/variants/:variant_id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      validateAndTransformBody(UpdateProductVariant),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/products/:id/variants/:variant_id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/products/:id/options',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      validateAndTransformBody(CreateProductOption),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/products/:id/options/:option_id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      validateAndTransformBody(UpdateProductOption),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/products/:id/options/:option_id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      })
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
  },
  {
    method: ['POST'],
    matcher: '/vendor/products/:id/status',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      checkConfigurationRule(
        ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL,
        false
      ),
      validateAndTransformBody(VendorUpdateProductStatus),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  }
]
