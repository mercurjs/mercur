import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { storeProductAttributeQueryConfig } from "./query-config"
import {
  StoreGetProductAttributeParams,
  StoreGetProductAttributesParams,
} from "./validators"

const applyAttributeFilters = (req, _, next) => {
  req.filterableFields = req.filterableFields ?? {}
  req.filterableFields.is_active = true
  req.filterableFields.product_id = null
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
