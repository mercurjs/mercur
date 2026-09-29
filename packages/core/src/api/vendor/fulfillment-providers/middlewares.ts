import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorFulfillmentProviderQueryConfig } from "./query-config"
import { VendorGetFulfillmentProvidersParams } from "./validators"

export const vendorFulfillmentProvidersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/fulfillment-providers",
    middlewares: [
      requirePermission("fulfillment_sets", "view"),
      validateAndTransformQuery(
        VendorGetFulfillmentProvidersParams,
        vendorFulfillmentProviderQueryConfig.list
      ),
    ],
  },
]
