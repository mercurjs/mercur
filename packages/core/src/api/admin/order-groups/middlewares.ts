import {
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { applySellerFilter } from "./apply-seller-filter"
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
      applySellerFilter,
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
