import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorShippingProfileQueryConfig } from "./query-config"
import {
  VendorGetShippingProfileParams,
  VendorGetShippingProfilesParams,
} from "./validators"

export const vendorShippingProfilesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/shipping-profiles",
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingProfilesParams,
        vendorShippingProfileQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.shipping_profile,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/shipping-profiles/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingProfileParams,
        vendorShippingProfileQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.shipping_profile,
        operation: PolicyOperation.read,
      },
    ],
  },
]
