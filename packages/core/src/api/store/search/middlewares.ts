import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { storeSearchQueryConfig } from "./query-config"
import { StoreGetSearchParams } from "./validators"

export const storeSearchMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/search",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
      validateAndTransformQuery(
        StoreGetSearchParams,
        storeSearchQueryConfig.list
      ),
    ],
  },
]
