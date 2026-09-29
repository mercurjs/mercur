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
      requirePermission("commission_rates", "view"),
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
      requirePermission("commission_rates", "edit"),
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
      requirePermission("commission_rates", "view"),
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
      requirePermission("commission_rates", "edit"),
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
      requirePermission("commission_rates", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission-rates/:id/rules",
    middlewares: [
      requirePermission("commission_rates", "edit"),
      validateAndTransformBody(AdminBatchCommissionRules),
    ],
  },
]
