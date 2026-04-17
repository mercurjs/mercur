import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { storeProductQueryConfig } from "./query-config"
import {
  StoreGetProductParams,
  StoreGetProductsParams,
} from "./validators"

const applyProductFilters = (req, _, next) => {
  req.filterableFields = req.filterableFields ?? {}
  req.filterableFields.status = "accepted"
  req.filterableFields.is_active = true
  next()
}

export const storeProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/products",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductsParams,
        storeProductQueryConfig.list
      ),
      applyProductFilters,
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/products/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductParams,
        storeProductQueryConfig.retrieve
      ),
      applyProductFilters,
    ],
  },
]
