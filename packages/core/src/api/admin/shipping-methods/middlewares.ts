import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { adminShippingMethodQueryConfig } from "./query-config"
import {
  AdminCreateShippingMethod,
  AdminGetShippingMethodParams,
  AdminGetShippingMethodsParams,
  AdminUpdateShippingMethod,
} from "./validators"

export const adminShippingMethodsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/shipping-methods",
    middlewares: [
      requirePermission("shipping_rules", "view"),
      validateAndTransformQuery(
        AdminGetShippingMethodsParams,
        adminShippingMethodQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/shipping-methods",
    middlewares: [
      requirePermission("shipping_rules", "manage"),
      validateAndTransformBody(AdminCreateShippingMethod),
      validateAndTransformQuery(
        AdminGetShippingMethodParams,
        adminShippingMethodQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/shipping-methods/:id",
    middlewares: [
      requirePermission("shipping_rules", "view"),
      validateAndTransformQuery(
        AdminGetShippingMethodParams,
        adminShippingMethodQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/shipping-methods/:id",
    middlewares: [
      requirePermission("shipping_rules", "edit"),
      validateAndTransformBody(AdminUpdateShippingMethod),
      validateAndTransformQuery(
        AdminGetShippingMethodParams,
        adminShippingMethodQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/shipping-methods/:id",
    middlewares: [requirePermission("shipping_rules", "manage")],
  },
]
