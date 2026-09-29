import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorRegionQueryConfig } from "./query-config"
import { VendorGetRegionParams, VendorGetRegionsParams } from "./validators"

export const vendorRegionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/regions",
    middlewares: [
      requirePermission("regions", "view"),
      validateAndTransformQuery(
        VendorGetRegionsParams,
        vendorRegionQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/regions/:id",
    middlewares: [
      requirePermission("regions", "view"),
      validateAndTransformQuery(
        VendorGetRegionParams,
        vendorRegionQueryConfig.retrieve
      ),
    ],
  },
]
