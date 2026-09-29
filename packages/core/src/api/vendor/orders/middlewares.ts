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

import {
  vendorOrderChangesQueryConfig,
  vendorOrderQueryConfig,
} from "./query-config"
import {
  VendorCancelFulfillment,
  VendorCreateFulfillment,
  VendorCreateShipment,
  VendorGetOrderChangesParams,
  VendorGetOrderParams,
  VendorGetOrdersParams,
} from "./validators"

const applySellerLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "order_seller",
    resourceId: "order_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorOrdersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/orders/:id/commission-lines",
    middlewares: [requirePermission("commissions", "view")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/orders",
    middlewares: [
      requirePermission("orders", "view"),
      validateAndTransformQuery(
        VendorGetOrdersParams,
        vendorOrderQueryConfig.list
      ),
      applySellerLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/orders/:id",
    middlewares: [
      requirePermission("orders", "view"),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/orders/:id/preview",
    middlewares: [
      requirePermission("orders", "view"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/orders/:id/cancel",
    middlewares: [
      requirePermission("orders", "edit"),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/orders/:id/complete",
    middlewares: [
      requirePermission("orders", "edit"),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/orders/:id/changes",
    middlewares: [
      requirePermission("orders", "view"),
      validateAndTransformQuery(
        VendorGetOrderChangesParams,
        vendorOrderChangesQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/orders/:id/fulfillments",
    middlewares: [
      requirePermission("orders", "edit"),
      validateAndTransformBody(VendorCreateFulfillment),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/orders/:id/fulfillments/:fulfillment_id/cancel",
    middlewares: [
      requirePermission("orders", "edit"),
      validateAndTransformBody(VendorCancelFulfillment),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/orders/:id/fulfillments/:fulfillment_id/mark-as-delivered",
    middlewares: [
      requirePermission("orders", "edit"),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/orders/:id/fulfillments/:fulfillment_id/shipments",
    middlewares: [
      requirePermission("orders", "edit"),
      validateAndTransformBody(VendorCreateShipment),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
    ],
  },
]
