import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"

export const vendorSettlementsMiddlewares: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/vendor/settlements", middlewares: [requirePermission("payouts", "view")] },
  { method: ["GET"], matcher: "/vendor/settlements/:id", middlewares: [requirePermission("payouts", "view")] },
]
