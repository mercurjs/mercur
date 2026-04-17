import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { storeProductAttributeQueryConfig } from "./query-config"
import {
  StoreGetProductAttributeParams,
  StoreGetProductAttributesParams,
} from "./validators"

const applyAttributeFilters = (req, _, next) => {
  req.filterableFields = req.filterableFields ?? {}
  req.filterableFields.is_global = true
  req.filterableFields.is_active = true
  next()
}

export const storeProductAttributesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/product-attributes",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductAttributesParams,
        storeProductAttributeQueryConfig.list
      ),
      applyAttributeFilters,
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/product-attributes/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductAttributeParams,
        storeProductAttributeQueryConfig.retrieve
      ),
      applyAttributeFilters,
    ],
  },
]
