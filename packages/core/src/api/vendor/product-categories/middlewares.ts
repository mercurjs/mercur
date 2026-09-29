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
      requirePermission("product_categories", "view"),
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
      requirePermission("product_categories", "view"),
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
      requirePermission("product_categories", "edit"),
      validateAndTransformBody(VendorBatchLinkProductsToCategory),
      validateAndTransformQuery(
        VendorProductCategoryParams,
        vendorProductCategoryQueryConfig.retrieve
      ),
    ],
  },
]
