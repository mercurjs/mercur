import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "shipping_option_seller",
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
      // Mirrors admin's `/admin/shipping-options` middleware: the raw
      // `stock_location_id` query param doesn't exist on `shipping_option`
      // — it has to be translated into a `service_zone.fulfillment_set_id`
      // filter via the `location_fulfillment_set` link. Without this hop
      // the query graph blows up with a 500 on
      // `?stock_location_id=sloc_…`.
      maybeApplyLinkFilter({
        entryPoint: "location_fulfillment_set",
        resourceId: "fulfillment_set_id",
        filterableField: "stock_location_id",
        filterByField: "service_zone.fulfillment_set_id",
      }),
      applySellerShippingOptionLinkFilter,
    ],
    policies: [
      {
        resource: PolicyResource.shipping_option,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.shipping_option,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.shipping_option,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.shipping_option,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/shipping-options/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.shipping_option,
        operation: PolicyOperation.delete,
      },
    ],
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
    policies: [
      {
        resource: PolicyResource.shipping_option,
        operation: PolicyOperation.update,
      },
    ],
  },
]
