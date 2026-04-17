import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorProductBrandQueryConfig } from "./query-config"
import {
  VendorGetProductBrandParams,
  VendorGetProductBrandsParams,
} from "./validators"

export const vendorProductBrandsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-brands",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductBrandsParams,
        vendorProductBrandQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-brands/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductBrandParams,
        vendorProductBrandQueryConfig.retrieve
      ),
    ],
  },
]
