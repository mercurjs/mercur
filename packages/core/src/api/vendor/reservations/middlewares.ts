import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { vendorReservationQueryConfig } from "./query-config"
import {
  VendorCreateReservation,
  VendorGetReservationParams,
  VendorGetReservationsParams,
  VendorUpdateReservation,
} from "./validators"

// Reservations have no seller column. Scope them to the authenticated seller
// through the inventory-item-seller link: resolve the seller's inventory item
// ids and narrow the reservation query by `inventory_item_id`.
const applySellerReservationLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "inventory_item_seller",
    resourceId: "inventory_item_id",
    filterableField: "seller_id",
    filterByField: "inventory_item_id",
  })(req, res, next)
}

// The list exposes a free-text SKU filter; SKU lives on the linked inventory
// item, which the reservation query can't filter through a nested relation
// path. Resolve the matching inventory item ids and narrow the already
// seller-scoped `inventory_item_id` set instead (dropping the flat `sku` key,
// since the reservation entity has no `sku` column).
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

  req.filterableFields = filterableFields

  return next()
}

export const vendorReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/reservations",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReservationsParams,
        vendorReservationQueryConfig.list
      ),
      applySellerReservationLinkFilter,
      // Runs after the seller scope so a sku query narrows the already-resolved
      // inventory_item_id set instead of replacing it.
      maybeApplyInventoryItemSkuFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/reservations/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/reservations",
    middlewares: [
      validateAndTransformBody(VendorCreateReservation),
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/reservations/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdateReservation),
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/reservations/:id",
    middlewares: [],
  },
]
