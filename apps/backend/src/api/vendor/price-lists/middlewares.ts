import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerPriceList from '../../../links/seller-price-list'
import { checkResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares'
import { vendorPriceListQueryConfig } from './query-config'
import {
  VendorCreatePriceList,
  VendorCreatePriceListPrice,
  VendorGetPriceListPricesParams,
  VendorUpdatePriceList
} from './validators'

export const vendorPriceListsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/price-lists',
    middlewares: [
      validateAndTransformQuery(
        VendorGetPriceListPricesParams,
        vendorPriceListQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/price-lists',
    middlewares: [
      validateAndTransformBody(VendorCreatePriceList),
      validateAndTransformQuery(
        VendorGetPriceListPricesParams,
        vendorPriceListQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/price-lists/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetPriceListPricesParams,
        vendorPriceListQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPriceList.entryPoint,
        filterField: 'price_list_id'
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/price-lists/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPriceList.entryPoint,
        filterField: 'price_list_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/price-lists/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetPriceListPricesParams,
        vendorPriceListQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdatePriceList),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPriceList.entryPoint,
        filterField: 'price_list_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/price-lists/:id/prices',
    middlewares: [
      validateAndTransformQuery(
        VendorGetPriceListPricesParams,
        vendorPriceListQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorCreatePriceListPrice),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPriceList.entryPoint,
        filterField: 'price_list_id'
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/price-lists/:id/prices/:price_id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPriceList.entryPoint,
        filterField: 'price_list_id'
      })
    ]
  }
]
