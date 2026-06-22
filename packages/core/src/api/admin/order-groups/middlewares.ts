import {
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { applyRequestFilter } from "./apply-request-filter"
import { adminOrderGroupQueryConfig } from "./query-config"
import {
  AdminGetOrderGroupParams,
  AdminGetOrderGroupsParams,
} from "./validators"

export const adminOrderGroupsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/order-groups",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrderGroupsParams,
        adminOrderGroupQueryConfig.list
      ),
      applyRequestFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/order-groups/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrderGroupParams,
        adminOrderGroupQueryConfig.retrieve
      ),
    ],
  },
]
