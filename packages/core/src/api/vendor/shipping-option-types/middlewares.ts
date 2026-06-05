import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorShippingOptionTypeQueryConfig } from "./query-config"
import {
  VendorGetShippingOptionTypeParams,
  VendorGetShippingOptionTypesParams,
} from "./validators"

export const vendorShippingOptionTypesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/shipping-option-types",
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingOptionTypesParams,
        vendorShippingOptionTypeQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/shipping-option-types/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingOptionTypeParams,
        vendorShippingOptionTypeQueryConfig.retrieve
      ),
    ],
  },
]
