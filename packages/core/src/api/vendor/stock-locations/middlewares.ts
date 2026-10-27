import { applySellerLinkFilter, requirePermission } from "../../utils"
import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { createLinkBody } from "@medusajs/medusa/api/utils/validators"

import { vendorStockLocationQueryConfig } from "./query-config"
import {
  VendorCreateStockLocation,
  VendorGetStockLocationParams,
  VendorGetStockLocationsParams,
  VendorUpdateStockLocation,
} from "./validators"

const applySellerStockLocationLinkFilter = applySellerLinkFilter()

export const vendorStockLocationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/stock-locations",
    middlewares: [
      requirePermission("stock_locations", "view"),
      validateAndTransformQuery(
        VendorGetStockLocationsParams,
        vendorStockLocationQueryConfig.list
      ),
      applySellerStockLocationLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/stock-locations",
    middlewares: [
      requirePermission("stock_locations", "edit"),
      validateAndTransformBody(VendorCreateStockLocation),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/stock-locations/:id",
    middlewares: [
      requirePermission("stock_locations", "view"),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/stock-locations/:id",
    middlewares: [
      requirePermission("stock_locations", "edit"),
      validateAndTransformBody(VendorUpdateStockLocation),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/stock-locations/:id",
    middlewares: [
      requirePermission("stock_locations", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/stock-locations/:id/sales-channels",
    middlewares: [
      requirePermission("stock_locations", "edit"),
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetStockLocationParams,
        vendorStockLocationQueryConfig.retrieve
      ),
    ],
  },
]
