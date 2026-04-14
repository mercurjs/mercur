import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { vendorStoreQueryConfig } from "./query-config"
import { VendorGetStoresParams } from "./validators"

export const vendorStoresMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/stores",
    middlewares: [
      validateAndTransformQuery(
        VendorGetStoresParams,
        vendorStoreQueryConfig.list
      ),
    ],
  },
]
