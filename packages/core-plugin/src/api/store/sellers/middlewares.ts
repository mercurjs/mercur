import { validateAndTransformQuery } from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import { storeSellerQueryConfig } from "./query-config"
import { StoreGetSellerParams, StoreGetSellersParams } from "./validators"

export const storeSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/sellers",
    middlewares: [
      validateAndTransformQuery(
        StoreGetSellersParams,
        storeSellerQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/sellers/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetSellerParams,
        storeSellerQueryConfig.retrieve
      ),
    ],
  },
]
