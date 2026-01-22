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

import { vendorStockLocationQueryConfig } from "./query-config"
import {
  VendorCreateStockLocation,
  VendorGetStockLocationParams,
  VendorGetStockLocationsParams,
  VendorUpdateStockLocation,
} from "./validators"

const applySellerStockLocationLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_stock_location",
    resourceId: "stock_location_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorStockLocationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/stock-locations",
    middlewares: [
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
    middlewares: [],
  },
]
