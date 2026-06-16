import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { AdminGetCustomerGroupOwnersParams } from "./validators"

export const adminCustomerGroupsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/customer-groups/owners",
    middlewares: [
      validateAndTransformQuery(AdminGetCustomerGroupOwnersParams, {}),
    ],
  },
]
