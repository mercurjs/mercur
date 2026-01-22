import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { createBatchBody } from "@medusajs/medusa/api/utils/validators"

import {
  vendorShippingOptionQueryConfig,
  vendorShippingOptionRuleQueryConfig,
} from "./query-config"
import {
  VendorCreateShippingOption,
  VendorCreateShippingOptionRule,
  VendorGetShippingOptionParams,
  VendorGetShippingOptionRuleParams,
  VendorGetShippingOptionsParams,
  VendorUpdateShippingOption,
  VendorUpdateShippingOptionRule,
} from "./validators"

export const vendorShippingOptionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/shipping-options",
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingOptionsParams,
        vendorShippingOptionQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/shipping-options",
    middlewares: [
      validateAndTransformBody(VendorCreateShippingOption),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorShippingOptionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/shipping-options/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorShippingOptionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/shipping-options/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdateShippingOption),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorShippingOptionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/shipping-options/:id",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/vendor/shipping-options/:id/rules/batch",
    middlewares: [
      validateAndTransformBody(
        createBatchBody(
          VendorCreateShippingOptionRule,
          VendorUpdateShippingOptionRule
        )
      ),
      validateAndTransformQuery(
        VendorGetShippingOptionRuleParams,
        vendorShippingOptionRuleQueryConfig.retrieve
      ),
    ],
  },
]
