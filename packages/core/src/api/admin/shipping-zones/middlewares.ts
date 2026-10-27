import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { adminShippingZoneQueryConfig } from "./query-config"
import {
  AdminCreateShippingZone,
  AdminGetShippingZoneParams,
  AdminGetShippingZonesParams,
  AdminUpdateShippingZone,
} from "./validators"

export const adminShippingZonesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/shipping-zones",
    middlewares: [
      requirePermission("shipping_rules", "view"),
      validateAndTransformQuery(
        AdminGetShippingZonesParams,
        adminShippingZoneQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/shipping-zones",
    middlewares: [
      requirePermission("shipping_rules", "manage"),
      validateAndTransformBody(AdminCreateShippingZone),
      validateAndTransformQuery(
        AdminGetShippingZoneParams,
        adminShippingZoneQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/shipping-zones/:id",
    middlewares: [
      requirePermission("shipping_rules", "view"),
      validateAndTransformQuery(
        AdminGetShippingZoneParams,
        adminShippingZoneQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/shipping-zones/:id",
    middlewares: [
      requirePermission("shipping_rules", "edit"),
      validateAndTransformBody(AdminUpdateShippingZone),
      validateAndTransformQuery(
        AdminGetShippingZoneParams,
        adminShippingZoneQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/shipping-zones/:id",
    middlewares: [requirePermission("shipping_rules", "manage")],
  },
]
