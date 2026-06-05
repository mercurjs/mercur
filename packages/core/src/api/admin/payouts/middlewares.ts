import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminPayoutQueryConfig } from "./query-config"
import { AdminGetPayoutParams, AdminGetPayoutsParams } from "./validators"

export const adminPayoutsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/payouts",
    middlewares: [
      validateAndTransformQuery(
        AdminGetPayoutsParams,
        adminPayoutQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/payouts/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetPayoutParams,
        adminPayoutQueryConfig.retrieve
      ),
    ],
  },
]
