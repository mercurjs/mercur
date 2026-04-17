import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { storeProductBrandQueryConfig } from "./query-config"
import {
  StoreGetProductBrandParams,
  StoreGetProductBrandsParams,
} from "./validators"

export const storeProductBrandsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/product-brands",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductBrandsParams,
        storeProductBrandQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/product-brands/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductBrandParams,
        storeProductBrandQueryConfig.retrieve
      ),
    ],
  },
]
