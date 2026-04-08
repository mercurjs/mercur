import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import {
  adminServiceFeeQueryConfig,
  adminServiceFeeChangeLogQueryConfig,
} from "./query-config"
import {
  AdminGetServiceFeeParams,
  AdminGetServiceFeesParams,
  AdminCreateServiceFee,
  AdminUpdateServiceFee,
  AdminBatchServiceFeeRules,
  AdminGetServiceFeeChangeLogsParams,
} from "./validators"

export const adminServiceFeesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/service-fees",
    middlewares: [
      validateAndTransformQuery(
        AdminGetServiceFeesParams,
        adminServiceFeeQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/service-fees",
    middlewares: [
      validateAndTransformBody(AdminCreateServiceFee),
      validateAndTransformQuery(
        AdminGetServiceFeeParams,
        adminServiceFeeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/service-fees/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetServiceFeeParams,
        adminServiceFeeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/service-fees/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateServiceFee),
      validateAndTransformQuery(
        AdminGetServiceFeeParams,
        adminServiceFeeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/service-fees/:id",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/admin/service-fees/:id/rules",
    middlewares: [validateAndTransformBody(AdminBatchServiceFeeRules)],
  },
  {
    method: ["POST"],
    matcher: "/admin/service-fees/:id/deactivate",
    middlewares: [
      validateAndTransformQuery(
        AdminGetServiceFeeParams,
        adminServiceFeeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/service-fees/:id/change-logs",
    middlewares: [
      validateAndTransformQuery(
        AdminGetServiceFeeChangeLogsParams,
        adminServiceFeeChangeLogQueryConfig.list
      ),
    ],
  },
]
