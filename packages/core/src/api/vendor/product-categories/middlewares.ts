import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorProductCategoryQueryConfig } from "./query-config"
import {
  VendorBatchLinkProductsToCategory,
  VendorGetProductCategoriesParams,
  VendorProductCategoryParams,
} from "./validators"

export const vendorProductCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-categories",
    middlewares: [
      requirePermission("taxonomy", "view"),
      validateAndTransformQuery(
        VendorGetProductCategoriesParams,
        vendorProductCategoryQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-categories/:id",
    middlewares: [
      requirePermission("taxonomy", "view"),
      validateAndTransformQuery(
        VendorProductCategoryParams,
        vendorProductCategoryQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/product-categories/:id/products",
    middlewares: [
      requirePermission("taxonomy", "edit"),
      validateAndTransformBody(VendorBatchLinkProductsToCategory),
      validateAndTransformQuery(
        VendorProductCategoryParams,
        vendorProductCategoryQueryConfig.retrieve
      ),
    ],
  },
]
