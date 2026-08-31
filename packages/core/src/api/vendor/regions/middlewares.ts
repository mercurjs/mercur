import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorRegionQueryConfig } from "./query-config"
import { VendorGetRegionParams, VendorGetRegionsParams } from "./validators"

export const vendorRegionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/regions",
    middlewares: [
      validateAndTransformQuery(
        VendorGetRegionsParams,
        vendorRegionQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.region,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/regions/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetRegionParams,
        vendorRegionQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.region,
        operation: PolicyOperation.read,
      },
    ],
  },
]
