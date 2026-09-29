import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminProductCategoryQueryConfig } from "./query-config"
import {
  AdminBatchLinkProductsToCategory,
  AdminBatchLinkSellersToCategory,
  AdminCreateProductCategory,
  AdminProductCategoriesParams,
  AdminProductCategoryParams,
  AdminUpdateProductCategory,
} from "./validators"
import { withOriginalMiddlewares } from "../../../utils/disable-medusa-middlewares"

const overrides: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/product-categories",
    middlewares: [
      requirePermission("taxonomy", "view"),
      validateAndTransformQuery(
        AdminProductCategoriesParams,
        adminProductCategoryQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-categories",
    middlewares: [
      requirePermission("taxonomy", "edit"),
      validateAndTransformBody(AdminCreateProductCategory),
      validateAndTransformQuery(
        AdminProductCategoryParams,
        adminProductCategoryQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-categories/:id",
    middlewares: [
      requirePermission("taxonomy", "view"),
      validateAndTransformQuery(
        AdminProductCategoryParams,
        adminProductCategoryQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-categories/:id",
    middlewares: [
      requirePermission("taxonomy", "edit"),
      validateAndTransformBody(AdminUpdateProductCategory),
      validateAndTransformQuery(
        AdminProductCategoryParams,
        adminProductCategoryQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/product-categories/:id",
    middlewares: [
      requirePermission("taxonomy", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-categories/:id/products",
    middlewares: [
      requirePermission("taxonomy", "edit"),
      validateAndTransformBody(AdminBatchLinkProductsToCategory)],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-categories/:id/sellers",
    middlewares: [
      requirePermission("taxonomy", "edit"),
      validateAndTransformBody(AdminBatchLinkSellersToCategory)],
  },
]

export const adminProductCategoriesMiddlewares = withOriginalMiddlewares(
  "dist/api/admin/product-categories/middlewares.js",
  overrides
)
