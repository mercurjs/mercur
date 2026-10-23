import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"

export const vendorTransfersMiddlewares: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/vendor/transfers", middlewares: [requirePermission("payouts", "view")] },
]
