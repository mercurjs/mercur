import { requirePermission } from "../../utils"
import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { z } from "zod"
import { AdminGetInventoryItemsParams } from "@medusajs/medusa/api/admin/inventory-items/validators"
import { listTransformQueryConfig } from "@medusajs/medusa/api/admin/inventory-items/query-config"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"
import {
  ensureBatchLevelsMatchSeller,
  ensureItemLevelsMatchSeller,
} from "./helpers"

const LIST_MATCHER = "/admin/inventory-items"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/inventory-items/middlewares.js"
] ?? []) as MiddlewareRoute[]

const ITEM_LEVEL_WRITE_MATCHERS = new Set([
  "/admin/inventory-items/:id/location-levels",
  "/admin/inventory-items/:id/location-levels/batch",
])
const BATCH_LEVELS_MATCHER = "/admin/inventory-items/location-levels/batch"

const routeMethods = (route: MiddlewareRoute) =>
  Array.isArray(route.method)
    ? route.method
    : route.method
    ? [route.method]
    : []

const baseWithoutListGet = capturedBase
  .filter((route) => {
    if (route.matcher !== LIST_MATCHER) return true
    return !routeMethods(route).includes("GET")
  })
  .map((route) => {
    if (!routeMethods(route).includes("POST")) return route

    if (ITEM_LEVEL_WRITE_MATCHERS.has(String(route.matcher))) {
      return {
        ...route,
        middlewares: [...(route.middlewares ?? []), ensureItemLevelsMatchSeller],
      }
    }
    if (route.matcher === BATCH_LEVELS_MATCHER) {
      return {
        ...route,
        middlewares: [...(route.middlewares ?? []), ensureBatchLevelsMatchSeller],
      }
    }
    return route
  })

const AdminGetInventoryItemsParamsWithSeller =
  AdminGetInventoryItemsParams.merge(
    z.object({
      seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    })
  )

const maybeApplySellerInventoryFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.filterableFields.seller_id) {
    return next()
  }

  return maybeApplyLinkFilter({
    entryPoint: "inventory_item_seller",
    resourceId: "inventory_item_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminInventoryItemsMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutListGet,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      requirePermission("inventory_items", "view"),
      validateAndTransformQuery(
        AdminGetInventoryItemsParamsWithSeller,
        listTransformQueryConfig
      ),
      maybeApplySellerInventoryFilter,
    ],
  },
]
