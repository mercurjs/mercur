import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
    policies: [
      {
        resource: PolicyResource.product_category,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.product_category,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.product_category,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.product_category,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/product-categories/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.product_category,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-categories/:id/products",
    middlewares: [validateAndTransformBody(AdminBatchLinkProductsToCategory)],
    policies: [
      {
        resource: PolicyResource.product_category,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-categories/:id/sellers",
    middlewares: [validateAndTransformBody(AdminBatchLinkSellersToCategory)],
    policies: [
      {
        resource: PolicyResource.product_category,
        operation: PolicyOperation.update,
      },
    ],
  },
]
