import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"
import { adminPayoutAccountQueryConfig } from "./query-config"
import {
  AdminCreatePayoutAccount,
  AdminGetPayoutAccountParams,
  AdminGetPayoutAccountsParams,
  AdminIgnorePayoutAccount,
} from "./validators"

const retrieve = validateAndTransformQuery(AdminGetPayoutAccountParams, adminPayoutAccountQueryConfig.retrieve)

export const adminPayoutAccountsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/payout-accounts",
    middlewares: [
      requirePermission("payouts", "view"),
      validateAndTransformQuery(AdminGetPayoutAccountsParams, adminPayoutAccountQueryConfig.list),
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
    matcher: "/admin/payout-accounts/:id/ignore",
    middlewares: [requirePermission("payouts", "edit"), validateAndTransformBody(AdminIgnorePayoutAccount), retrieve],
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
