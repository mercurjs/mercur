import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
      validateAndTransformQuery(
        VendorGetProductCategoriesParams,
        vendorProductCategoryQueryConfig.list
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
    method: ["GET"],
    matcher: "/vendor/product-categories/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorProductCategoryParams,
        vendorProductCategoryQueryConfig.retrieve
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
    matcher: "/vendor/product-categories/:id/products",
    middlewares: [
      validateAndTransformBody(VendorBatchLinkProductsToCategory),
      validateAndTransformQuery(
        VendorProductCategoryParams,
        vendorProductCategoryQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_category,
        operation: PolicyOperation.update,
      },
    ],
  },
]
