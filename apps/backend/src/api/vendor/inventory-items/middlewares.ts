import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import sellerInventoryItem from '../../../links/seller-inventory-item'
import sellerStockLocation from '../../../links/seller-stock-location'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import {
  vendorInventoryItemQueryConfig,
  vendorInventoryLevelQueryConfig
} from './query-config'
import {
  VendorCreateInventoryLocationLevel,
  VendorGetInventoryItemsParams,
  VendorUpdateInventoryItem,
  VendorUpdateInventoryLevel
} from './validators'

export const vendorInventoryItemsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/inventory-items',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryItemQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/inventory-items/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerInventoryItem.entryPoint,
        filterField: 'inventory_item_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/inventory-items/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdateInventoryItem),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerInventoryItem.entryPoint,
        filterField: 'inventory_item_id'
      })
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/inventory-items/:id/location-levels',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryLevelQueryConfig.list
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerInventoryItem.entryPoint,
        filterField: 'inventory_item_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/inventory-items/:id/location-levels',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryLevelQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorCreateInventoryLocationLevel),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerInventoryItem.entryPoint,
        filterField: 'inventory_item_id'
      })
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/inventory-items/:id/location-levels/:location_id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryLevelQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerInventoryItem.entryPoint,
        filterField: 'inventory_item_id'
      }),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerStockLocation.entryPoint,
        filterField: 'stock_location_id',
        resourceId: (req) => req.params.location_id
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/inventory-items/:id/location-levels/:location_id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryLevelQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdateInventoryLevel),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerInventoryItem.entryPoint,
        filterField: 'inventory_item_id'
      }),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerStockLocation.entryPoint,
        filterField: 'stock_location_id',
        resourceId: (req) => req.params.location_id
      })
    ]
  }
]
