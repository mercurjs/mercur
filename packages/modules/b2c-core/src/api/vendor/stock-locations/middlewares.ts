import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { createLinkBody } from '@medusajs/medusa/api/utils/validators'

import sellerStockLocationLink from '../../../links/seller-stock-location'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { vendorStockLocationQueryConfig } from './query-config'
import {
  VendorCreateStockLocation,
  VendorCreateStockLocationFulfillmentSet,
  VendorGetStockLocationParams,
  VendorUpdateStockLocation
} from './validators'

export const vendorStockLocationsMiddlewares: MiddlewareRoute[] = [
  /* Stock Location */
  {
    method: ['GET'],
    matcher: '/vendor/stock-locations',
    middlewares: [
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/stock-locations',
    middlewares: [
      validateAndTransformBody(VendorCreateStockLocation),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/stock-locations/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerStockLocationLink.entryPoint,
        filterField: 'stock_location_id'
      }),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/stock-locations/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerStockLocationLink.entryPoint,
        filterField: 'stock_location_id'
      }),
      validateAndTransformBody(VendorUpdateStockLocation),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/stock-locations/:id/fulfillment-providers',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerStockLocationLink.entryPoint,
        filterField: 'stock_location_id'
      }),
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/stock-locations/:id/sales-channels',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerStockLocationLink.entryPoint,
        filterField: 'stock_location_id'
      }),
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      )
    ]
  },
  /* Stock Location Fulfillment Set */
  {
    method: ['POST'],
    matcher: '/vendor/stock-locations/:id/fulfillment-sets',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerStockLocationLink.entryPoint,
        filterField: 'stock_location_id'
      }),
      validateAndTransformBody(VendorCreateStockLocationFulfillmentSet),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      )
    ]
  }
]
