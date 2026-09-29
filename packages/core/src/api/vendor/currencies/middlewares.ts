import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorCurrencyQueryConfig } from "./query-config"
import { VendorGetCurrenciesParams, VendorGetCurrencyParams } from "./validators"

export const vendorCurrenciesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/currencies",
    middlewares: [
      requirePermission("regions", "view"),
      validateAndTransformQuery(
        VendorGetCurrenciesParams,
        vendorCurrencyQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/currencies/:code",
    middlewares: [
      requirePermission("regions", "view"),
      validateAndTransformQuery(
        VendorGetCurrencyParams,
        vendorCurrencyQueryConfig.retrieve
      ),
    ],
  },
]
