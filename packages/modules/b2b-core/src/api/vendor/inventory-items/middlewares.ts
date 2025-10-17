import {
  unlessPath,
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
  VendorBatchInventoryItemLevels,
  VendorBatchInventoryItemLocationsLevel,
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
    method: ['POST'],
    matcher: '/vendor/inventory-items/location-levels/batch',
    middlewares: [validateAndTransformBody(VendorBatchInventoryItemLevels)]
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
    method: ['POST'],
    matcher: '/vendor/inventory-items/:id/location-levels/batch',
    middlewares: [
      validateAndTransformBody(VendorBatchInventoryItemLocationsLevel)
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/inventory-items/:id/location-levels/:location_id',
    middlewares: [
      unlessPath(
        /.*\/location-levels\/batch/,
        validateAndTransformQuery(
          VendorGetInventoryItemsParams,
          vendorInventoryLevelQueryConfig.retrieve
        )
      ),
      unlessPath(
        /.*\/location-levels\/batch/,
        checkResourceOwnershipByResourceId({
          entryPoint: sellerInventoryItem.entryPoint,
          filterField: 'inventory_item_id'
        })
      ),
      unlessPath(
        /.*\/location-levels\/batch/,
        checkResourceOwnershipByResourceId({
          entryPoint: sellerStockLocation.entryPoint,
          filterField: 'stock_location_id',
          resourceId: (req) => req.params.location_id
        })
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/inventory-items/:id/location-levels/:location_id',
    middlewares: [
      unlessPath(
        /.*\/location-levels\/batch/,
        validateAndTransformQuery(
          VendorGetInventoryItemsParams,
          vendorInventoryLevelQueryConfig.retrieve
        )
      ),
      unlessPath(
        /.*\/location-levels\/batch/,
        validateAndTransformBody(VendorUpdateInventoryLevel)
      ),
      unlessPath(
        /.*\/location-levels\/batch/,
        checkResourceOwnershipByResourceId({
          entryPoint: sellerInventoryItem.entryPoint,
          filterField: 'inventory_item_id'
        })
      ),
      unlessPath(
        /.*\/location-levels\/batch/,
        checkResourceOwnershipByResourceId({
          entryPoint: sellerStockLocation.entryPoint,
          filterField: 'stock_location_id',
          resourceId: (req) => req.params.location_id
        })
      )
    ]
  }
]
