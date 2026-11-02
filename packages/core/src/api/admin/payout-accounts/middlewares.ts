import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute, maybeApplyLinkFilter } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"
import { adminPayoutAccountQueryConfig } from "./query-config"
import {
  AdminCreatePayoutAccount,
  AdminGetPayoutAccountParams,
  AdminGetPayoutAccountsParams,
} from "./validators"

const retrieve = validateAndTransformQuery(AdminGetPayoutAccountParams, adminPayoutAccountQueryConfig.retrieve)

export const adminPayoutAccountsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/payout-accounts",
    middlewares: [
      requirePermission("payouts", "view"),
      validateAndTransformQuery(AdminGetPayoutAccountsParams, adminPayoutAccountQueryConfig.list),
      maybeApplyLinkFilter({
        entryPoint: "seller_payout_account",
        resourceId: "payout_account_id",
        filterableField: "seller_id",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/payout-accounts",
    middlewares: [requirePermission("payouts", "edit"), validateAndTransformBody(AdminCreatePayoutAccount), retrieve],
  },
  {
    method: ["GET"],
    matcher: "/admin/payout-accounts/:id",
    middlewares: [requirePermission("payouts", "view"), retrieve],
  },
  {
    method: ["POST"],
    matcher: "/admin/payout-accounts/:id/refresh-link",
    middlewares: [requirePermission("payouts", "edit"), retrieve],
  },
  {
    method: ["POST"],
    matcher: "/admin/payout-accounts/:id/sync",
    middlewares: [requirePermission("payouts", "edit"), retrieve],
  },
]
