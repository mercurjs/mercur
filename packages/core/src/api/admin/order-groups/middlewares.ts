import { requireAnyPermission } from "../../utils"
import {
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { applyOrderGroupSellerFilter } from "./helpers"
import { adminOrderGroupQueryConfig } from "./query-config"
import {
  AdminGetOrderGroupParams,
  AdminGetOrderGroupsParams,
} from "./validators"

// The admin orders list is a list of order groups, so orders:view is enough
// to read them.
const canViewOrderGroups = requireAnyPermission([
  { key: "orders", right: "view" },
  { key: "order_groups", right: "view" },
])

export const adminOrderGroupsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/order-groups",
    middlewares: [
      canViewOrderGroups,
      validateAndTransformQuery(
        AdminGetOrderGroupsParams,
        adminOrderGroupQueryConfig.list
      ),
      applyOrderGroupSellerFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/order-groups/:id",
    middlewares: [
      canViewOrderGroups,
      validateAndTransformQuery(
        AdminGetOrderGroupParams,
        adminOrderGroupQueryConfig.retrieve
      ),
    ],
  },
]
