import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import {
  vendorInventoryItemQueryConfig,
  vendorInventoryLevelQueryConfig
} from './query-config'
import {
  VendorCreateInventoryItem,
  VendorCreateInventoryLocationLevel,
  VendorGetInventoryItemsParams,
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
    method: ['POST'],
    matcher: '/vendor/inventory-items',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorCreateInventoryItem)
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
      // Check?
      checkResourceOwnershipByResourceId({
        entryPoint: 'seller_product',
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
      validateAndTransformBody(VendorCreateInventoryItem),
      checkResourceOwnershipByResourceId({
        entryPoint: 'seller_product',
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
        entryPoint: 'seller_product',
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
        entryPoint: 'seller_product',
        filterField: 'inventory_item_id'
      })
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/inventory-items/:id/location-levels/:locationId',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryLevelQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: 'seller_product',
        filterField: 'inventory_item_id'
      }),
      checkResourceOwnershipByResourceId({
        entryPoint: 'seller_stock_location',
        filterField: 'location_id',
        resourceId: (req) => req.params.locationId
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/inventory-items/:id/location-levels/:locationId',
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryLevelQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdateInventoryLevel),
      checkResourceOwnershipByResourceId({
        entryPoint: 'seller_product',
        filterField: 'inventory_item_id'
      }),
      checkResourceOwnershipByResourceId({
        entryPoint: 'seller_stock_location',
        filterField: 'location_id',
        resourceId: (req) => req.params.locationId
      })
    ]
  }
]
