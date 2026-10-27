import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute, defineMiddlewares } from "@medusajs/framework/http"
import { requirePermission } from "@mercurjs/core/api/utils/index"

import {
  AdminCreateAdjustment,
  AdminGetAdjustmentsParams,
  AdminGetSettlementsParams,
  AdminIgnoreAccount,
  AdminRunJob,
} from "./admin/validators"

const view = requirePermission("payouts", "view")
const edit = requirePermission("payouts", "edit")

const routes: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/admin/stripe/status", middlewares: [view] },
  { method: ["GET"], matcher: "/admin/stripe/jobs", middlewares: [view] },
  { method: ["GET"], matcher: "/admin/stripe/jobs/:job/runs", middlewares: [view] },
  {
    method: ["POST"],
    matcher: "/admin/stripe/jobs/:job/run",
    middlewares: [edit, validateAndTransformBody(AdminRunJob)],
  },
  { method: ["GET"], matcher: "/admin/stripe/notifications", middlewares: [view] },
  { method: ["POST"], matcher: "/admin/stripe/notifications/test", middlewares: [edit] },
  { method: ["GET"], matcher: "/admin/stripe/captures", middlewares: [view] },
  { method: ["GET"], matcher: "/admin/stripe/captures/:order_group_id", middlewares: [view] },
  { method: ["POST"], matcher: "/admin/stripe/captures/:order_group_id/capture", middlewares: [edit] },
  { method: ["POST"], matcher: "/admin/stripe/captures/:order_group_id/cancel", middlewares: [edit] },
  {
    method: ["GET"],
    matcher: "/admin/stripe/settlements",
    middlewares: [view, validateAndTransformQuery(AdminGetSettlementsParams, { isList: true, defaults: ["id"] })],
  },
  { method: ["GET"], matcher: "/admin/stripe/settlements/:id", middlewares: [view] },
  { method: ["POST"], matcher: "/admin/stripe/settlements/:id/retry", middlewares: [edit] },
  {
    method: ["GET"],
    matcher: "/admin/stripe/adjustments",
    middlewares: [view, validateAndTransformQuery(AdminGetAdjustmentsParams, { isList: true, defaults: ["id"] })],
  },
  {
    method: ["POST"],
    matcher: "/admin/stripe/adjustments",
    middlewares: [edit, validateAndTransformBody(AdminCreateAdjustment)],
  },
  {
    method: ["POST"],
    matcher: "/admin/stripe/accounts/:id/ignore",
    middlewares: [edit, validateAndTransformBody(AdminIgnoreAccount)],
  },
  { method: ["GET"], matcher: "/vendor/stripe/settlements", middlewares: [view] },
  { method: ["GET"], matcher: "/vendor/stripe/settlements/:id", middlewares: [view] },
]

export default defineMiddlewares({ routes })
