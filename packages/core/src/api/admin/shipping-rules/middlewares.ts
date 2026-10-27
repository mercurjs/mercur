import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { adminShippingRuleQueryConfig } from "./query-config"
import {
  AdminBatchShippingRules,
  AdminCreateShippingRule,
  AdminGetShippingRuleParams,
  AdminGetShippingRulesParams,
  AdminUpdateShippingRule,
} from "./validators"

export const adminShippingRulesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/shipping-rules",
    middlewares: [
      requirePermission("shipping_rules", "view"),
      validateAndTransformQuery(
        AdminGetShippingRulesParams,
        adminShippingRuleQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/shipping-rules",
    middlewares: [
      requirePermission("shipping_rules", "manage"),
      validateAndTransformBody(AdminCreateShippingRule),
      validateAndTransformQuery(
        AdminGetShippingRuleParams,
        adminShippingRuleQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/shipping-rules/batch",
    middlewares: [
      requirePermission("shipping_rules", "manage"),
      validateAndTransformBody(AdminBatchShippingRules),
      validateAndTransformQuery(
        AdminGetShippingRuleParams,
        adminShippingRuleQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/shipping-rules/:id",
    middlewares: [
      requirePermission("shipping_rules", "view"),
      validateAndTransformQuery(
        AdminGetShippingRuleParams,
        adminShippingRuleQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/shipping-rules/:id",
    middlewares: [
      requirePermission("shipping_rules", "edit"),
      validateAndTransformBody(AdminUpdateShippingRule),
      validateAndTransformQuery(
        AdminGetShippingRuleParams,
        adminShippingRuleQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/shipping-rules/:id",
    middlewares: [requirePermission("shipping_rules", "manage")],
  },
]
