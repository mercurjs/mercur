import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"
import { adminTransferQueryConfig } from "./query-config"
import { AdminGetTransferParams, AdminGetTransfersParams } from "./validators"

const retrieve = validateAndTransformQuery(AdminGetTransferParams, adminTransferQueryConfig.retrieve)

export const adminTransfersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/transfers",
    middlewares: [
      requirePermission("payouts", "view"),
      validateAndTransformQuery(AdminGetTransfersParams, adminTransferQueryConfig.list),
    ],
  },
  { method: ["GET"], matcher: "/admin/transfers/:id", middlewares: [requirePermission("payouts", "view"), retrieve] },
  { method: ["POST"], matcher: "/admin/transfers/:id/retry", middlewares: [requirePermission("payouts", "edit"), retrieve] },
]
