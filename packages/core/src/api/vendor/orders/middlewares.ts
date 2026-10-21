import { applySellerLinkFilter, requirePermission } from "../../utils"
import {
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

const applySellerOrderLinkFilter = applySellerLinkFilter()

export const vendorOrdersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/orders/:id/commission-lines",
    middlewares: [requirePermission("commission_lines", "view")],
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
      applySellerOrderLinkFilter,
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
