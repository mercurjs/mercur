import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
      validateAndTransformQuery(
        VendorGetInventoryItemsParams,
        vendorInventoryItemQueryConfig.list
      ),
      applySellerInventoryItemLinkFilter,
    ],
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/inventory-items/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.delete,
      },
    ],
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
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/inventory-items/location-levels/batch",
    middlewares: [
      validateAndTransformBody(VendorBatchInventoryItemLevels),
      validateAndTransformQuery(
        VendorGetInventoryLocationLevelParams,
        vendorLocationLevelQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.inventory_item,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
