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
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_inventory_item",
    resourceId: "inventory_item_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorInventoryItemsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/inventory-items",
    middlewares: [
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
    middlewares: [],
  },
  {
    method: ["GET"],
    matcher: "/vendor/inventory-items/:id/location-levels",
    middlewares: [
      validateAndTransformQuery(
        VendorGetInventoryLocationLevelsParams,
        vendorLocationLevelQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/inventory-items/:id/location-levels",
    middlewares: [
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
      validateAndTransformQuery(
        VendorGetInventoryItemParams,
        vendorInventoryItemQueryConfig.retrieve
      ),
    ],
  },
]
