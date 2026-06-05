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
      validateAndTransformQuery(
        VendorGetPricePreferenceParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
]
