import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"

export const adminPayoutStatusMiddlewares: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/admin/payout-status", middlewares: [requirePermission("payouts", "view")] },
]
