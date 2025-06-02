import multer from 'multer'

import {
  unlessPath,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT, MiddlewareRoute } from '@medusajs/medusa'

import sellerProductLink from '../../../links/seller-product'
import { ConfigurationRuleType } from '../../../modules/configuration/types'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { checkConfigurationRule } from '../../../shared/infra/http/middlewares'
import { vendorProductQueryConfig, vendorProductVariantQueryConfig } from './query-config'
import {
  CreateProductOption,
  CreateProductVariant,
  UpdateProductOption,
  UpdateProductVariant,
  VendorAssignBrandName,
  VendorCreateProduct,
  VendorGetProductParams,
  VendorGetProductVariantsParams,
  VendorUpdateProduct,
  VendorUpdateProductStatus
} from './validators'
import { AdminBatchUpdateProductVariant } from '@medusajs/medusa/api/admin/products/validators'
import { createBatchBody } from '@medusajs/medusa/api/utils/validators'
import { AdminGetProductVariantParams } from '@medusajs/medusa/api/admin/products/validators'

const canVendorCreateProduct = [
  checkConfigurationRule(ConfigurationRuleType.GLOBAL_PRODUCT_CATALOG, false),
  checkConfigurationRule(ConfigurationRuleType.PRODUCT_REQUEST_ENABLED, true)
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
    method: ['GET'],
    matcher: '/vendor/products/:id/variants',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      validateAndTransformQuery(
        VendorGetProductVariantsParams,
        vendorProductVariantQueryConfig.list
      ),
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
      validateAndTransformBody(VendorUpdateProductStatus),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/variants/batch",
    bodyParser: {
      sizeLimit: DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT,
    },
    middlewares: [
      validateAndTransformBody(
        createBatchBody(CreateProductVariant, AdminBatchUpdateProductVariant)
      ),
      validateAndTransformQuery(
        AdminGetProductVariantParams,
        vendorProductVariantQueryConfig.retrieve
      ),
    ],
  },
]
