import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { listTransformQueryConfig } from "@medusajs/medusa/api/admin/campaigns/query-config"
import { AdminGetCampaignsParams } from "@medusajs/medusa/api/admin/campaigns/validators"
import { z } from "zod"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"
import { applyCampaignFilters } from "./helpers"

const LIST_MATCHER = "/admin/campaigns"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/campaigns/middlewares.js"
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
  if (route.matcher === LIST_MATCHER && routeHasGet(route)) {
    return false
  }
  return true
})

const AdminGetCampaignsWithFilters = AdminGetCampaignsParams.merge(
  z.object({
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    budget_type: z.string().optional(),
    status: z.enum(["active", "expired", "scheduled"]).optional(),
  })
)

export const adminCampaignsMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutOverrides,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetCampaignsWithFilters,
        listTransformQueryConfig
      ),
      applyCampaignFilters,
    ],
  },
]
