import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { listPriceListQueryConfig } from "@medusajs/medusa/api/admin/price-lists/query-config"
import { AdminGetPriceListsParams } from "@medusajs/medusa/api/admin/price-lists/validators"
import { z } from "zod"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"

const LIST_MATCHER = "/admin/price-lists"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/price-lists/middlewares.js"
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

const dateOperators = z
  .object({
    $gt: z.string(),
    $gte: z.string(),
    $lt: z.string(),
    $lte: z.string(),
  })
  .partial()

// The native list validator only exposes `status`. Add the marketplace list
// filters used by the admin Price Lists table (`type`, `created_at`,
// `updated_at`) — all native `price_list` columns, so the default handler
// applies them as filters once they pass validation; no link resolution needed.
const AdminGetPriceListsWithFilters = AdminGetPriceListsParams.merge(
  z.object({
    type: z
      .union([
        z.enum(["sale", "override"]),
        z.array(z.enum(["sale", "override"])),
      ])
      .optional(),
    created_at: dateOperators.optional(),
    updated_at: dateOperators.optional(),
  })
)

export const adminPriceListsMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutOverrides,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetPriceListsWithFilters,
        listPriceListQueryConfig
      ),
    ],
  },
]
