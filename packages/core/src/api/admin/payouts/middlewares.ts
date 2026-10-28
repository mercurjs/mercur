import { requirePermission } from "../../utils"
import { MiddlewareRoute, maybeApplyLinkFilter } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminPayoutQueryConfig } from "./query-config"
import { AdminGetPayoutParams, AdminGetPayoutsParams } from "./validators"

export const adminPayoutsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/payouts/:id/retry",
    middlewares: [
      requirePermission("payouts", "edit"),
      validateAndTransformQuery(AdminGetPayoutParams, adminPayoutQueryConfig.retrieve),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/payouts",
    middlewares: [
      requirePermission("payouts", "view"),
      validateAndTransformQuery(
        AdminGetPayoutsParams,
        adminPayoutQueryConfig.list
      ),
      maybeApplyLinkFilter({
        entryPoint: "seller_payout_account",
        resourceId: "payout_account_id",
        filterableField: "seller_id",
        filterByField: "account_id",
      }),
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
