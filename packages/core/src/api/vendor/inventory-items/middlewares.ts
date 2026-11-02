import { applySellerLinkFilter, requirePermission } from "../../utils"
import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorInventoryItemQueryConfig, vendorLocationLevelQueryConfig } from "./query-config"
import {
  VendorBatchInventoryItemLevels,
  VendorBatchInventoryItemLocationsLevel,
  VendorCreateInventoryItem,
  VendorCreateInventoryLocationLevel,
  VendorGetInventoryItemParams,
  VendorGetInventoryItemsParams,
  VendorGetInventoryLocationLevelParams,
  VendorGetInventoryLocationLevelsParams,
  VendorUpdateInventoryItem,
  VendorUpdateInventoryLocationLevel,
} from "./validators"

const applySellerInventoryItemLinkFilter = applySellerLinkFilter()

export const vendorInventoryItemsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/inventory-items",
    middlewares: [
      requirePermission("inventory_items", "view"),
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryItemQueryConfig.list
      ),
      applySellerInventoryItemLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/inventory-items/:id",
    middlewares: [
      requirePermission("inventory_items", "view"),
      validateAndTransformQuery(
        VendorGetInventoryItemParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/inventory-items",
    middlewares: [
      requirePermission("inventory_items", "edit"),
      validateAndTransformBody(VendorCreateInventoryItem),
      validateAndTransformQuery(
        VendorGetInventoryItemParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/inventory-items/:id",
    middlewares: [
      requirePermission("inventory_items", "edit"),
      validateAndTransformBody(VendorUpdateInventoryItem),
      validateAndTransformQuery(
        VendorGetInventoryItemParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/inventory-items/:id",
    middlewares: [
      requirePermission("inventory_items", "manage"),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/inventory-items/:id/location-levels",
    middlewares: [
      requirePermission("inventory_items", "view"),
      validateAndTransformQuery(
        VendorGetInventoryLocationLevelsParams,
        vendorLocationLevelQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/inventory-items/location-levels/batch",
    middlewares: [
      requirePermission("inventory_items", "edit"),
      validateAndTransformBody(VendorBatchInventoryItemLevels),
      validateAndTransformQuery(
        VendorGetInventoryLocationLevelParams,
        vendorLocationLevelQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/inventory-items/:id/location-levels",
    middlewares: [
      requirePermission("inventory_items", "edit"),
      validateAndTransformBody(VendorCreateInventoryLocationLevel),
      validateAndTransformQuery(
        VendorGetInventoryItemParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/inventory-items/:id/location-levels/batch",
    middlewares: [
      requirePermission("inventory_items", "edit"),
      validateAndTransformBody(VendorBatchInventoryItemLocationsLevel),
      validateAndTransformQuery(
        VendorGetInventoryLocationLevelParams,
        vendorLocationLevelQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/inventory-items/:id/location-levels/:location_id",
    middlewares: [
      requirePermission("inventory_items", "edit"),
      validateAndTransformBody(VendorUpdateInventoryLocationLevel),
      validateAndTransformQuery(
        VendorGetInventoryItemParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/inventory-items/:id/location-levels/:location_id",
    middlewares: [
      requirePermission("inventory_items", "manage"),
      validateAndTransformQuery(
        VendorGetInventoryItemParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
    ],
  },
]
