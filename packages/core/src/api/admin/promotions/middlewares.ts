import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  listRuleValueTransformQueryConfig,
  listTransformQueryConfig,
} from "@medusajs/medusa/api/admin/promotions/query-config"
import {
  AdminGetPromotionsParams,
  AdminGetPromotionsRuleValueParams,
} from "@medusajs/medusa/api/admin/promotions/validators"
import { z } from "zod"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"
import { AdminUpsertPromotionCost } from "./[id]/cost/validators"
import { applyPromotionSellerFilter } from "./helpers"

const RULE_VALUE_MATCHER =
  "/admin/promotions/rule-value-options/:rule_type/:rule_attribute_id"
const LIST_MATCHER = "/admin/promotions"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/promotions/middlewares.js"
] ?? []) as MiddlewareRoute[]

const routeHasGet = (route: MiddlewareRoute) => {
  const methods = Array.isArray(route.method)
    ? route.method
    : route.method
    ? [route.method]
    : []
  return methods.includes("GET")
}

const baseWithoutOverrides = capturedBase.filter((route) => {
  if (route.matcher === RULE_VALUE_MATCHER && routeHasGet(route)) {
    return false
  }
  if (route.matcher === LIST_MATCHER && routeHasGet(route)) {
    return false
  }
  return true
})

const AdminGetPromotionsRuleValueWithSeller =
  AdminGetPromotionsRuleValueParams.merge(
    z.object({ seller_id: z.string().optional() })
  )

const AdminGetPromotionsWithSeller = AdminGetPromotionsParams.merge(
  z.object({
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

export const adminPromotionsMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutOverrides,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetPromotionsWithSeller,
        listTransformQueryConfig
      ),
      applyPromotionSellerFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: RULE_VALUE_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetPromotionsRuleValueWithSeller,
        listRuleValueTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/promotions/:id/cost",
    middlewares: [validateAndTransformBody(AdminUpsertPromotionCost)],
  },
]
