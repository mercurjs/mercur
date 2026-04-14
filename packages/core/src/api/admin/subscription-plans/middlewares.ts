import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { subscriptionPlanQueryConfig } from "./query-config"
import {
  AdminGetSubscriptionPlansParams,
  AdminGetSubscriptionPlanParams,
  AdminCreateSubscriptionPlan,
  AdminUpdateSubscriptionPlan,
  AdminCreateSubscriptionOverride,
  AdminUpdateSubscriptionOverride,
} from "./validators"

export const adminSubscriptionPlanRoutesMiddlewares: MiddlewareRoute[] = [
  // GET /admin/subscription-plans — list plans
  {
    method: ["GET"],
    matcher: "/admin/subscription-plans",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSubscriptionPlansParams,
        subscriptionPlanQueryConfig.list
      ),
    ],
  },
  // POST /admin/subscription-plans — create plan
  {
    method: ["POST"],
    matcher: "/admin/subscription-plans",
    middlewares: [
      validateAndTransformBody(AdminCreateSubscriptionPlan),
      validateAndTransformQuery(
        AdminGetSubscriptionPlanParams,
        subscriptionPlanQueryConfig.retrieve
      ),
    ],
  },
  // GET /admin/subscription-plans/:id — get plan
  {
    method: ["GET"],
    matcher: "/admin/subscription-plans/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSubscriptionPlanParams,
        subscriptionPlanQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/subscription-plans/:id — update plan
  {
    method: ["POST"],
    matcher: "/admin/subscription-plans/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateSubscriptionPlan),
      validateAndTransformQuery(
        AdminGetSubscriptionPlanParams,
        subscriptionPlanQueryConfig.retrieve
      ),
    ],
  },
  // DELETE /admin/subscription-plans/:id — delete plan
  {
    method: ["DELETE"],
    matcher: "/admin/subscription-plans/:id",
    middlewares: [],
  },
  // POST /admin/subscription-plans/:id/overrides — create override
  {
    method: ["POST"],
    matcher: "/admin/subscription-plans/:id/overrides",
    middlewares: [
      validateAndTransformBody(AdminCreateSubscriptionOverride),
      validateAndTransformQuery(
        AdminGetSubscriptionPlanParams,
        subscriptionPlanQueryConfig.retrieve
      ),
    ],
  },
  // GET /admin/subscription-plans/:id/overrides/:override_id — get override
  {
    method: ["GET"],
    matcher: "/admin/subscription-plans/:id/overrides/:override_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSubscriptionPlanParams,
        subscriptionPlanQueryConfig.retrieveOverride
      ),
    ],
  },
  // POST /admin/subscription-plans/:id/overrides/:override_id — update override
  {
    method: ["POST"],
    matcher: "/admin/subscription-plans/:id/overrides/:override_id",
    middlewares: [
      validateAndTransformBody(AdminUpdateSubscriptionOverride),
      validateAndTransformQuery(
        AdminGetSubscriptionPlanParams,
        subscriptionPlanQueryConfig.retrieveOverride
      ),
    ],
  },
  // DELETE /admin/subscription-plans/:id/overrides/:override_id — delete override
  {
    method: ["DELETE"],
    matcher: "/admin/subscription-plans/:id/overrides/:override_id",
    middlewares: [],
  },
]
