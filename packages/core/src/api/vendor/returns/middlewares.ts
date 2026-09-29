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

import { validateSellerOrder } from "../orders/helpers"
import { vendorReturnQueryConfig } from "./query-config"
import {
  VendorGetReturnParams,
  VendorGetReturnsOrderParams,
  VendorGetReturnsParams,
  VendorPostCancelReturnReq,
  VendorPostReceiveReturnsReq,
  VendorPostReturnsConfirmRequestReq,
  VendorPostReturnsReceiveItemsReq,
  VendorPostReturnsReq,
  VendorPostReturnsRequestItemsActionReq,
  VendorPostReturnsRequestItemsReq,
  VendorPostReturnsReturnReq,
  VendorPostReturnsShippingActionReq,
  VendorPostReturnsShippingReq,
} from "./validators"

const applySellerOrderLinkFilter = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (req.filterableFields.order_id) {
    await validateSellerOrder(
      req.scope,
      req.seller_context!.seller_id,
      req.filterableFields.order_id as string | string[]
    )
    return next()
  }

  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "order_seller",
    resourceId: "order_id",
    filterableField: "seller_id",
    filterByField: "order_id",
  })(req, res, next)
}

export const vendorReturnsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/returns",
    middlewares: [
      requirePermission("orders.returns", "view"),
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnQueryConfig.list
      ),
      applySellerOrderLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/returns/:id",
    middlewares: [
      requirePermission("orders.returns", "view"),
      validateAndTransformQuery(
        VendorGetReturnParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsReturnReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/request-items",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsRequestItemsReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/request-items/:action_id",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsRequestItemsActionReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/returns/:id/request-items/:action_id",
    middlewares: [
      requirePermission("orders.returns", "manage"),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/shipping-method",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsShippingReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/shipping-method/:action_id",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsShippingActionReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/returns/:id/shipping-method/:action_id",
    middlewares: [
      requirePermission("orders.returns", "manage"),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/request",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsConfirmRequestReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/cancel",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostCancelReturnReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/returns/:id/request",
    middlewares: [
      requirePermission("orders.returns", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/receive",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReceiveReturnsReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/returns/:id/receive",
    middlewares: [
      requirePermission("orders.returns", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/receive/confirm",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsConfirmRequestReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/receive-items",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsReceiveItemsReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/receive-items/:action_id",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsRequestItemsActionReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/returns/:id/receive-items/:action_id",
    middlewares: [
      requirePermission("orders.returns", "manage"),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/dismiss-items",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsReceiveItemsReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/dismiss-items/:action_id",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorPostReturnsRequestItemsActionReq),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/returns/:id/dismiss-items/:action_id",
    middlewares: [
      requirePermission("orders.returns", "manage"),
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
]
