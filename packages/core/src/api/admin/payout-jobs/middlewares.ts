import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"

export const adminPayoutJobsMiddlewares: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/admin/payout-jobs", middlewares: [requirePermission("payouts", "view")] },
  { method: ["GET"], matcher: "/admin/payout-jobs/:job/runs", middlewares: [requirePermission("payouts", "view")] },
  { method: ["POST"], matcher: "/admin/payout-jobs/:job/run", middlewares: [requirePermission("payouts", "edit")] },
]
