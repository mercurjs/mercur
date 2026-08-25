import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorFulfillmentProviderQueryConfig } from "./query-config"
import { VendorGetFulfillmentProvidersParams } from "./validators"

export const vendorFulfillmentProvidersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/fulfillment-providers",
    middlewares: [
      validateAndTransformQuery(
        VendorGetFulfillmentProvidersParams,
        vendorFulfillmentProviderQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.fulfillment_provider,
        operation: PolicyOperation.read,
      },
    ],
  },
]
