import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorProductAttributeQueryConfig } from "./query-config"
import {
  VendorGetProductAttributeParams,
  VendorGetProductAttributesParams,
} from "./validators"

export const vendorProductAttributesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-attributes",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductAttributesParams,
        vendorProductAttributeQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-attributes/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductAttributeParams,
        vendorProductAttributeQueryConfig.retrieve
      ),
    ],
  },
]
