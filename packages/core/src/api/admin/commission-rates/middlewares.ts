import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminCommissionRateQueryConfig } from "./query-config"
import {
  AdminGetCommissionRateParams,
  AdminGetCommissionRatesParams,
  AdminCreateCommissionRate,
  AdminUpdateCommissionRate,
  AdminBatchCommissionRules,
} from "./validators"

export const adminCommissionRatesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/commission-rates",
    middlewares: [
      requirePermission("commissions", "view"),
      validateAndTransformQuery(
        AdminGetCommissionRatesParams,
        adminCommissionRateQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission-rates",
    middlewares: [
      requirePermission("commissions", "edit"),
      validateAndTransformBody(AdminCreateCommissionRate),
      validateAndTransformQuery(
        AdminGetCommissionRateParams,
        adminCommissionRateQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/commission-rates/:id",
    middlewares: [
      requirePermission("commissions", "view"),
      validateAndTransformQuery(
        AdminGetCommissionRateParams,
        adminCommissionRateQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission-rates/:id",
    middlewares: [
      requirePermission("commissions", "edit"),
      validateAndTransformBody(AdminUpdateCommissionRate),
      validateAndTransformQuery(
        AdminGetCommissionRateParams,
        adminCommissionRateQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/commission-rates/:id",
    middlewares: [
      requirePermission("commissions", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission-rates/:id/rules",
    middlewares: [
      requirePermission("commissions", "edit"),
      validateAndTransformBody(AdminBatchCommissionRules),
    ],
  },
]
