import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import {
  listTransformQueryConfig,
  retrieveTransformQueryConfig,
} from "./query-config"
import {
  VendorGetPricePreferenceParams,
  VendorGetPricePreferencesParams,
} from "./validators"

export const vendorPricePreferencesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/price-preferences",
    middlewares: [
      requirePermission("price_preferences", "view"),
      validateAndTransformQuery(
        VendorGetPricePreferencesParams,
        listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/price-preferences/:id",
    middlewares: [
      requirePermission("price_preferences", "view"),
      validateAndTransformQuery(
        VendorGetPricePreferenceParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
]
