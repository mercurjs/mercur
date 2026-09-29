import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorProductTypeQueryConfig } from "./query-config"
import {
  VendorGetProductTypeParams,
  VendorGetProductTypesParams,
} from "./validators"

export const vendorProductTypesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-types",
    middlewares: [
      requirePermission("taxonomy", "view"),
      validateAndTransformQuery(
        VendorGetProductTypesParams,
        vendorProductTypeQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-types/:id",
    middlewares: [
      requirePermission("taxonomy", "view"),
      validateAndTransformQuery(
        VendorGetProductTypeParams,
        vendorProductTypeQueryConfig.retrieve
      ),
    ],
  },
]
