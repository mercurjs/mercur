import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
    policies: [
      {
        resource: PolicyResource.price_preference,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.price_preference,
        operation: PolicyOperation.read,
      },
    ],
  },
]
