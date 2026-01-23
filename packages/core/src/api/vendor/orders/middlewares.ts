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
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_order",
    resourceId: "order_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorOrdersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/orders",
    middlewares: [
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
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/orders/:id/preview",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/vendor/orders/:id/cancel",
    middlewares: [
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
      validateAndTransformBody(VendorCreateFulfillment),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/orders/:id/fulfillments/:fulfillment_id/cancel",
    middlewares: [
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
      validateAndTransformBody(VendorCreateShipment),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
    ],
  },
]
