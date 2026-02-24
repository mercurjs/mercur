import { MiddlewareRoute, validateAndTransformBody, validateAndTransformQuery } from '@medusajs/framework'

import { checkResourcesOwnershipByResourceBatch, filterBySellerId } from '../../../shared/infra/http/middlewares'
import {
  vendorProductCollectionQueryConfig,
  vendorProductCollectionsProductsQueryConfig
} from './query-config'
import {
  VendorGetProductCollectionParams,
  VendorGetProductCollectionsParams,
  VendorGetProductCollectionsProductsParams
} from './validators'
import { createLinkBody } from '@medusajs/medusa/api/utils/validators'
import sellerProductLink from "../../../links/seller-product";

export const vendorProductCollectionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/product-collections',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCollectionsParams,
        vendorProductCollectionQueryConfig.list
      ),
      filterBySellerId()
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
  },
  {
    method: ["POST"],
    matcher: "/vendor/product-collections/:id/products",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCollectionsProductsParams,
        vendorProductCollectionsProductsQueryConfig.list
      ),
      validateAndTransformBody(createLinkBody()),
      filterBySellerId(),
      checkResourcesOwnershipByResourceBatch({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id',
      }),
    ],
  },
]
