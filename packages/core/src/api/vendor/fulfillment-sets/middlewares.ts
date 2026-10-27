import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorServiceZoneQueryConfig } from "./query-config"
import { VendorServiceZoneParams } from "./validators"

export const vendorFulfillmentSetsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/fulfillment-sets/:id/service-zones/:zone_id",
    middlewares: [
      requirePermission("fulfillment_sets", "view"),
      validateAndTransformQuery(
        VendorServiceZoneParams,
        vendorServiceZoneQueryConfig.retrieve
      ),
    ],
  },
]
