import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
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

const applySellerShippingOptionLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_shipping_option",
    resourceId: "shipping_option_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorShippingOptionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/shipping-options",
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingOptionsParams,
        vendorShippingOptionQueryConfig.list
      ),
      applySellerShippingOptionLinkFilter,
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
