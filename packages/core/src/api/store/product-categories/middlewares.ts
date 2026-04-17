import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { storeProductCategoryQueryConfig } from "./query-config"
import {
  StoreGetProductCategoriesParams,
  StoreProductCategoryParams,
} from "./validators"

const applyCategoryFilters = (req, _, next) => {
  req.filterableFields = req.filterableFields ?? {}
  req.filterableFields.is_active = true
  req.filterableFields.is_internal = false
  next()
}

export const storeProductCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/product-categories",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductCategoriesParams,
        storeProductCategoryQueryConfig.list
      ),
      applyCategoryFilters,
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/product-categories/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreProductCategoryParams,
        storeProductCategoryQueryConfig.retrieve
      ),
      applyCategoryFilters,
    ],
  },
]
