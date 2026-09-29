import { requirePermission } from "../../utils"
import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
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

const applySellerInventoryItemLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id =  req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "inventory_item_seller",
    resourceId: "inventory_item_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorInventoryItemsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/inventory-items",
    middlewares: [
      requirePermission("inventory", "view"),
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
      requirePermission("inventory", "view"),
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
      requirePermission("inventory", "edit"),
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
      requirePermission("inventory", "edit"),
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
      requirePermission("inventory", "manage"),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/inventory-items/:id/location-levels",
    middlewares: [
      requirePermission("inventory", "view"),
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
      requirePermission("inventory", "edit"),
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
      requirePermission("inventory", "edit"),
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
      requirePermission("inventory", "edit"),
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
      requirePermission("inventory", "edit"),
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
      requirePermission("inventory", "manage"),
      validateAndTransformQuery(
        VendorGetInventoryItemParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
    ],
  },
]
