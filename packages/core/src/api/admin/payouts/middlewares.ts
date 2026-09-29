import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminPayoutQueryConfig } from "./query-config"
import { AdminGetPayoutParams, AdminGetPayoutsParams } from "./validators"

export const adminPayoutsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/payouts",
    middlewares: [
      requirePermission("payouts", "view"),
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
      requirePermission("payouts", "view"),
      validateAndTransformQuery(
        AdminGetPayoutParams,
        adminPayoutQueryConfig.retrieve
      ),
    ],
  },
]
