import { requirePermission } from "../../utils"
import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { validateSellerOrder } from "../orders/helpers"
import { validateSellerStockLocations } from "../stock-locations/helpers"
import { vendorReservationQueryConfig } from "./query-config"
import {
  VendorCreateReservation,
  VendorGetReservationParams,
  VendorGetReservationsParams,
  VendorUpdateReservation,
} from "./validators"

/**
 * Reservations have no direct reservation↔seller link — they belong to a seller
 * only through their inventory item (`inventory_item_seller`). These middlewares
 * scope the vendor reservation routes to the caller's own inventory items so a
 * vendor can never read, list, edit, delete, or create a reservation against
 * another store's inventory.
 */
const getSellerInventoryItemIds = async (
  req: AuthenticatedMedusaRequest,
  restrictTo?: string[]
): Promise<string[]> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const filters: Record<string, unknown> = {
    seller_id: req.seller_context!.seller_id,
  }
  if (restrictTo?.length) {
    filters.inventory_item_id = restrictTo
  }

  const { data } = await query.graph({
    entity: "inventory_item_seller",
    fields: ["inventory_item_id"],
    filters,
    pagination: {
      take: restrictTo?.length ? restrictTo.length : 100000,
      skip: 0,
    },
  })

  return (data as Array<{ inventory_item_id: string }>).map(
    (row) => row.inventory_item_id
  )
}

// The list exposes a free-text SKU filter; SKU lives on the linked inventory
// item, which the reservation query can't filter through a nested relation
// path. Resolve the matching inventory item ids and narrow the query by
// `inventory_item_id`. Runs before the seller scope so a sku query is
// intersected with the seller's own items rather than replacing it.
const maybeApplyInventoryItemSkuFilter = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sku = req.filterableFields?.sku as string | undefined
  if (!sku) {
    return next()
  }

  delete req.filterableFields.sku

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
    filters: { sku },
  })

  const matchedIds = inventoryItems.map((item) => item.id as string)
  const existing = req.filterableFields.inventory_item_id

  if (existing) {
    const existingIds = Array.isArray(existing) ? existing : [existing]
    req.filterableFields.inventory_item_id = existingIds.filter((id) =>
      matchedIds.includes(id as string)
    )
  } else {
    req.filterableFields.inventory_item_id = matchedIds
  }

  return next()
}

const applySellerReservationsFilter = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    const requested = req.filterableFields.inventory_item_id as
      | string
      | string[]
      | undefined

    let allowedIds: string[]
    if (requested !== undefined && requested !== null) {
      const requestedIds = Array.isArray(requested) ? requested : [requested]
      // Keep only the requested items the seller actually owns.
      allowedIds = await getSellerInventoryItemIds(req, requestedIds)
    } else {
      allowedIds = await getSellerInventoryItemIds(req)
    }

    // Sentinel that matches nothing, so an empty set never widens the query.
    req.filterableFields.inventory_item_id = allowedIds.length
      ? allowedIds
      : ["__none__"]

    return next()
  } catch (error) {
    return next(error)
  }
}

const assertReservationOwnership = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "reservation",
      fields: ["id", "inventory_item_id"],
      filters: { id: req.params.id },
    })

    const reservation = data[0] as
      | { id: string; inventory_item_id: string }
      | undefined

    const owned = reservation
      ? await getSellerInventoryItemIds(req, [reservation.inventory_item_id])
      : []

    if (!reservation || !owned.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Reservation with id: ${req.params.id} was not found`
      )
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

type ReservationBody = {
  inventory_item_id?: string
  location_id?: string
  line_item_id?: string | null
}

const assertSellerOwnsLineItem = async (
  req: AuthenticatedMedusaRequest,
  lineItemId: string
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [orderItem],
  } = await query.graph({
    entity: "order_item",
    fields: ["order_id"],
    filters: { item_id: lineItemId },
  })

  if (!orderItem?.order_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Line item with id: ${lineItemId} was not found`
    )
  }

  await validateSellerOrder(
    req.scope,
    req.seller_context!.seller_id,
    orderItem.order_id
  )
}

const assertReservationBodyOwnership = async (
  req: AuthenticatedMedusaRequest
) => {
  const body = (req.validatedBody ?? {}) as ReservationBody

  if (body.location_id) {
    await validateSellerStockLocations(req.scope, req.seller_context!.seller_id, [
      body.location_id,
    ])
  }

  if (body.line_item_id) {
    await assertSellerOwnsLineItem(req, body.line_item_id)
  }
}

const assertCreateReservationOwnership = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    const itemId = (req.validatedBody as ReservationBody)?.inventory_item_id
    const owned = itemId ? await getSellerInventoryItemIds(req, [itemId]) : []

    if (!owned.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You are not allowed to create a reservation for this inventory item"
      )
    }

    await assertReservationBodyOwnership(req)

    return next()
  } catch (error) {
    return next(error)
  }
}

const assertUpdateReservationOwnership = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    await assertReservationBodyOwnership(req)
    return next()
  } catch (error) {
    return next(error)
  }
}

export const vendorReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/reservations",
    middlewares: [
      requirePermission("reservations", "view"),
      validateAndTransformQuery(
        VendorGetReservationsParams,
        vendorReservationQueryConfig.list
      ),
      maybeApplyInventoryItemSkuFilter,
      applySellerReservationsFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/reservations/:id",
    middlewares: [
      requirePermission("reservations", "view"),
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
      assertReservationOwnership,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/reservations",
    middlewares: [
      requirePermission("reservations", "edit"),
      validateAndTransformBody(VendorCreateReservation),
      assertCreateReservationOwnership,
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
      requirePermission("reservations", "edit"),
      validateAndTransformBody(VendorUpdateReservation),
      assertReservationOwnership,
      assertUpdateReservationOwnership,
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/reservations/:id",
    middlewares: [
      requirePermission("reservations", "manage"),
      assertReservationOwnership],
  },
]
