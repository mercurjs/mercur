import {
  authenticate,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import { storeOrderGroupQueryConfig } from "./query-config"
import {
  StoreGetOrderGroupParams,
  StoreGetOrderGroupsParams,
} from "./validators"

export const storeOrderGroupsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/order-groups",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetOrderGroupsParams,
        storeOrderGroupQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/order-groups/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetOrderGroupParams,
        storeOrderGroupQueryConfig.retrieve
      ),
    ],
  },
]
