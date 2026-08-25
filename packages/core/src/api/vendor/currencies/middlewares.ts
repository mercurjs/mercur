import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorCurrencyQueryConfig } from "./query-config"
import { VendorGetCurrenciesParams, VendorGetCurrencyParams } from "./validators"

export const vendorCurrenciesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/currencies",
    middlewares: [
      validateAndTransformQuery(
        VendorGetCurrenciesParams,
        vendorCurrencyQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.currency,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/currencies/:code",
    middlewares: [
      validateAndTransformQuery(
        VendorGetCurrencyParams,
        vendorCurrencyQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.currency,
        operation: PolicyOperation.read,
      },
    ],
  },
]
