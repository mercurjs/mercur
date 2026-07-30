import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"
import { listTransformQueryConfig } from "./query-config"
import { AdminGetReservationsParams } from "./validators"

const LIST_MATCHER = "/admin/reservations"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/reservations/middlewares.js"
] ?? []) as MiddlewareRoute[]

const baseWithoutListGet = capturedBase.filter((route) => {
  if (route.matcher !== LIST_MATCHER) return true
  const methods = Array.isArray(route.method)
    ? route.method
    : route.method
    ? [route.method]
    : []
  return !methods.includes("GET")
})

// The list exposes a free-text SKU filter; SKU lives on the linked inventory
// item, so reshape it into a nested relation filter and drop the flat key
// (the reservation entity has no `sku` column).
const maybeApplyInventoryItemSkuFilter = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sku = req.filterableFields?.sku as string | undefined

  if (!sku) {
    return next()
  }

  const existing = (req.filterableFields.inventory_item ?? {}) as Record<
    string,
    unknown
  >
  req.filterableFields.inventory_item = { ...existing, sku }
  delete req.filterableFields.sku

  return next()
}

export const adminReservationsMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutListGet,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetReservationsParams,
        listTransformQueryConfig
      ),
      maybeApplyInventoryItemSkuFilter,
      // Store filter: inventory_item -> seller (inventory-item-seller-link).
      // Resolve matching inventory item ids from the link and filter
      // reservations by inventory_item_id.
      maybeApplyLinkFilter({
        entryPoint: "inventory_item_seller",
        resourceId: "inventory_item_id",
        filterableField: "seller_id",
        filterByField: "inventory_item_id",
      }),
    ],
  },
]
