import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"

export const adminPayoutNotificationsMiddlewares: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/admin/payout-notifications", middlewares: [requirePermission("payouts", "view")] },
  { method: ["POST"], matcher: "/admin/payout-notifications/test", middlewares: [requirePermission("payouts", "edit")] },
]
