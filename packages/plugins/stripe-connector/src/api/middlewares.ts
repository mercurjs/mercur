import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute, defineMiddlewares } from "@medusajs/framework/http"
import { requirePermission } from "@mercurjs/core/api/utils/index"

import {
  AdminCreateAdjustment,
  AdminGetAdjustmentsParams,
  AdminGetCaptureParams,
  AdminGetCapturesParams,
  AdminGetSelectParams,
  AdminGetSettlementsParams,
  AdminIgnoreAccount,
  AdminRunJob,
} from "./admin/validators"
import { adminAdjustmentQueryConfig } from "./admin/stripe/adjustments/query-config"
import { adminStripeAccountQueryConfig } from "./admin/stripe/accounts/query-config"
import { adminCaptureQueryConfig } from "./admin/stripe/captures/query-config"
import { adminSettlementQueryConfig, vendorSettlementQueryConfig } from "./admin/stripe/settlements/query-config"

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
  {
    method: ["GET"],
    matcher: "/admin/stripe/captures",
    middlewares: [view, validateAndTransformQuery(AdminGetCapturesParams, adminCaptureQueryConfig.list)],
  },
  {
    method: ["GET"],
    matcher: "/admin/stripe/captures/:order_group_id",
    middlewares: [view, validateAndTransformQuery(AdminGetCaptureParams, adminCaptureQueryConfig.retrieve)],
  },
  {
    method: ["POST"],
    matcher: "/admin/stripe/captures/:order_group_id/capture",
    middlewares: [edit, validateAndTransformQuery(AdminGetCaptureParams, adminCaptureQueryConfig.retrieve)],
  },
  {
    method: ["POST"],
    matcher: "/admin/stripe/captures/:order_group_id/cancel",
    middlewares: [edit, validateAndTransformQuery(AdminGetCaptureParams, adminCaptureQueryConfig.retrieve)],
  },
  {
    method: ["GET"],
    matcher: "/admin/stripe/settlements",
    middlewares: [view, validateAndTransformQuery(AdminGetSettlementsParams, adminSettlementQueryConfig.list)],
  },
  {
    method: ["GET"],
    matcher: "/admin/stripe/settlements/:id",
    middlewares: [view, validateAndTransformQuery(AdminGetSelectParams, adminSettlementQueryConfig.retrieve)],
  },
  {
    method: ["POST"],
    matcher: "/admin/stripe/settlements/:id/retry",
    middlewares: [edit, validateAndTransformQuery(AdminGetSelectParams, adminSettlementQueryConfig.retrieve)],
  },
  {
    method: ["GET"],
    matcher: "/admin/stripe/adjustments",
    middlewares: [view, validateAndTransformQuery(AdminGetAdjustmentsParams, adminAdjustmentQueryConfig.list)],
  },
  {
    method: ["POST"],
    matcher: "/admin/stripe/adjustments",
    middlewares: [
      edit,
      validateAndTransformBody(AdminCreateAdjustment),
      validateAndTransformQuery(AdminGetSelectParams, adminAdjustmentQueryConfig.retrieve),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/stripe/accounts/:id/ignore",
    middlewares: [
      edit,
      validateAndTransformBody(AdminIgnoreAccount),
      validateAndTransformQuery(AdminGetSelectParams, adminStripeAccountQueryConfig.retrieve),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/stripe/settlements",
    middlewares: [view, validateAndTransformQuery(AdminGetSettlementsParams, vendorSettlementQueryConfig.list)],
  },
  {
    method: ["GET"],
    matcher: "/vendor/stripe/settlements/:id",
    middlewares: [view, validateAndTransformQuery(AdminGetSelectParams, vendorSettlementQueryConfig.retrieve)],
  },
]

export default defineMiddlewares({ routes })
