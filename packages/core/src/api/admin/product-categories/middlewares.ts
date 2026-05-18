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

export const adminProductCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/product-categories",
    middlewares: [
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
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-categories/:id/products",
    middlewares: [validateAndTransformBody(AdminBatchLinkProductsToCategory)],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-categories/:id/sellers",
    middlewares: [validateAndTransformBody(AdminBatchLinkSellersToCategory)],
  },
]
