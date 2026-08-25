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
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnQueryConfig.list
      ),
      applySellerOrderLinkFilter,
    ],
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.delete,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.delete,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/returns/:id/request",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.delete,
      },
    ],
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/returns/:id/receive",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.delete,
      },
    ],
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.delete,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.return,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
