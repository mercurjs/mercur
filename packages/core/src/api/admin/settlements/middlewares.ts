import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"
import { AdminGetSettlementsParams } from "./validators"

export const adminSettlementsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/settlements",
    middlewares: [
      requirePermission("payouts", "view"),
      validateAndTransformQuery(AdminGetSettlementsParams, { isList: true, defaults: ["id"] }),
    ],
  },
  { method: ["GET"], matcher: "/admin/settlements/:id", middlewares: [requirePermission("payouts", "view")] },
]
