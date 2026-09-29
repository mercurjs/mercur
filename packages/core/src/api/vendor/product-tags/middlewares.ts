import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorProductTagsQueryConfig } from "./query-config"
import {
  VendorGetProductTagParams,
  VendorGetProductTagsParams,
} from "./validators"

export const vendorProductTagsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-tags",
    middlewares: [
      requirePermission("product_tags", "view"),
      validateAndTransformQuery(
        VendorGetProductTagsParams,
        vendorProductTagsQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-tags/:id",
    middlewares: [
      requirePermission("product_tags", "view"),
      validateAndTransformQuery(
        VendorGetProductTagParams,
        vendorProductTagsQueryConfig.retrieve
      ),
    ],
  },
]
