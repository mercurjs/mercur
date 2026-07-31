import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

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
// item, which the reservation query can't filter through a nested relation
// path. Resolve the matching inventory item ids up front and narrow the
// reservation query by `inventory_item_id` instead (dropping the flat `sku`
// key, since the reservation entity has no `sku` column).
const maybeApplyInventoryItemSkuFilter = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields
  const sku = filterableFields?.sku as string | undefined

  if (!sku) {
    return next()
  }

  delete filterableFields.sku

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
    filters: { sku },
  })

  const matchedIds = inventoryItems.map((item) => item.id as string)
  const existing = filterableFields.inventory_item_id

  if (existing) {
    const existingIds = Array.isArray(existing) ? existing : [existing]
    filterableFields.inventory_item_id = existingIds.filter((id) =>
      matchedIds.includes(id as string)
    )
  } else {
    filterableFields.inventory_item_id = matchedIds
  }

  // Reassign so the mutation sticks — `req.filterableFields` returns a fresh
  // object per access, mirroring `maybeApplyLinkFilter`.
  req.filterableFields = filterableFields

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
      // Store filter: inventory_item -> seller (inventory-item-seller-link).
      // Resolve matching inventory item ids from the link and filter
      // reservations by inventory_item_id.
      maybeApplyLinkFilter({
        entryPoint: "inventory_item_seller",
        resourceId: "inventory_item_id",
        filterableField: "seller_id",
        filterByField: "inventory_item_id",
      }),
      // Runs after the store filter so a combined sku + store query narrows
      // the already-resolved inventory_item_id set instead of replacing it.
      maybeApplyInventoryItemSkuFilter,
    ],
  },
]
