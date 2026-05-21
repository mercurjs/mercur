import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorProductVariantsQueryConfig } from "./query-config"
import { VendorGetProductVariantsParams } from "./validators"

export const vendorProductVariantsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-variants",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductVariantsParams,
        vendorProductVariantsQueryConfig.list
      ),
    ],
  },
]
