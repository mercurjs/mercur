import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"
import { adminReturnRequestQueryConfig } from "./query-config"
import {
  AdminAcceptReturnRequest,
  AdminApproveReturnRequest,
  AdminCreateReturnRequest,
  AdminDeclineReturnRequest,
  AdminGetReturnRequestParams,
  AdminGetReturnRequestsParams,
} from "./validators"

export const adminReturnRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/return-requests",
    middlewares: [
      requirePermission("orders.returns", "view"),
      validateAndTransformQuery(
        AdminGetReturnRequestsParams,
        adminReturnRequestQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/return-requests",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(AdminCreateReturnRequest),
      validateAndTransformQuery(
        AdminGetReturnRequestParams,
        adminReturnRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/return-requests/:id",
    middlewares: [
      requirePermission("orders.returns", "view"),
      validateAndTransformQuery(
        AdminGetReturnRequestParams,
        adminReturnRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/return-requests/:id/accept",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(AdminAcceptReturnRequest),
      validateAndTransformQuery(
        AdminGetReturnRequestParams,
        adminReturnRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/return-requests/:id/decline",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(AdminDeclineReturnRequest),
      validateAndTransformQuery(
        AdminGetReturnRequestParams,
        adminReturnRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/return-requests/:id/approve",
    middlewares: [
      requirePermission("orders.refunds", "edit"),
      validateAndTransformBody(AdminApproveReturnRequest),
      validateAndTransformQuery(
        AdminGetReturnRequestParams,
        adminReturnRequestQueryConfig.retrieve
      ),
    ],
  },
]
