import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { vendorShippingOptionQueryConfig } from "../shipping-options/query-config"
import { VendorGetShippingOptionParams } from "../shipping-options/validators"
import {
  VendorEnableShippingRule,
  VendorGetShippingRulesParams,
} from "./validators"

export const vendorShippingRulesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/shipping-rules",
    middlewares: [
      requirePermission("shipping_options", "view"),
      validateAndTransformQuery(VendorGetShippingRulesParams, {
        isList: true,
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/shipping-rules/:id/enable",
    middlewares: [
      requirePermission("shipping_options", "edit"),
      validateAndTransformBody(VendorEnableShippingRule),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorShippingOptionQueryConfig.retrieve
      ),
    ],
  },
]
