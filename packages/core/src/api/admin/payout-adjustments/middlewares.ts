import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"
import { AdminCreateAdjustment, AdminGetAdjustmentsParams } from "./validators"

export const adminPayoutAdjustmentsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/payout-adjustments",
    middlewares: [
      requirePermission("payouts", "view"),
      validateAndTransformQuery(AdminGetAdjustmentsParams, { isList: true, defaults: ["id"] }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/payout-adjustments",
    middlewares: [requirePermission("payouts", "edit"), validateAndTransformBody(AdminCreateAdjustment)],
  },
]
