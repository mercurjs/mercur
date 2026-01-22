import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import {
  vendorProductCategoryProductsQueryConfig,
  vendorProductCategoryQueryConfig,
} from "./query-config"
import {
  VendorBatchProductsToCategory,
  VendorGetProductCategoriesParams,
  VendorGetProductCategoryParams,
  VendorGetProductCategoryProductsParams,
} from "./validators"

export const vendorProductCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-categories",
    middlewares: [
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
      validateAndTransformQuery(
        VendorGetProductCategoryParams,
        vendorProductCategoryQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-categories/:id/products",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCategoryProductsParams,
        vendorProductCategoryProductsQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/product-categories/:id/products",
    middlewares: [
      validateAndTransformBody(VendorBatchProductsToCategory),
      validateAndTransformQuery(
        VendorGetProductCategoryParams,
        vendorProductCategoryQueryConfig.retrieve
      ),
    ],
  },
]
