import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"

export const adminPayoutCapturesMiddlewares: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/admin/payout-captures", middlewares: [requirePermission("payouts", "view")] },
  { method: ["POST"], matcher: "/admin/payout-captures/:order_group_id/capture", middlewares: [requirePermission("payouts", "edit")] },
  { method: ["POST"], matcher: "/admin/payout-captures/:order_group_id/cancel", middlewares: [requirePermission("payouts", "edit")] },
]
