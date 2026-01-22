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
      req.auth_context.actor_id,
      req.filterableFields.order_id as string | string[]
    )
    return next()
  }

  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_order",
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
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/receive",
    middlewares: [
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
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/vendor/returns/:id/receive/confirm",
    middlewares: [
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
      validateAndTransformQuery(
        VendorGetReturnsOrderParams,
        vendorReturnQueryConfig.retrieve
      ),
    ],
  },
]
