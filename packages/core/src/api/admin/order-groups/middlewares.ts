import { requirePermission } from "../../utils"
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

export const adminOrderGroupsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/order-groups",
    middlewares: [
      requirePermission("order_groups", "view"),
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
      requirePermission("order_groups", "view"),
      validateAndTransformQuery(
        AdminGetOrderGroupParams,
        adminOrderGroupQueryConfig.retrieve
      ),
    ],
  },
]
