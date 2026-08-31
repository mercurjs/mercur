import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
      validateAndTransformQuery(
        AdminGetOrderGroupsParams,
        adminOrderGroupQueryConfig.list
      ),
      applyOrderGroupSellerFilter,
    ],
    policies: [
      {
        resource: PolicyResource.order_group,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.order_group,
        operation: PolicyOperation.read,
      },
    ],
  },
]
