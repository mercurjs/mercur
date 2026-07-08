import { OrderPreviewDTO } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MathBN,
  Modules,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { confirmOrderEditRequestWorkflow as baseConfirmOrderEditRequestWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Mercur wrapper around Medusa's `confirmOrderEditRequestWorkflow`.
 *
 * Mercur pins `variant.manage_inventory = false` on every product
 * variant (see `update-products.ts`), so Medusa's
 * `prepareConfirmInventoryInput` skips every cart item and
 * `reserveInventoryStep` runs as a no-op inside Medusa's confirm. That
 * means newly added items in an order edit get **no reservation at
 * all** from the base workflow, and existing items with their qty
 * bumped still hold the old reservation Medusa just deleted.
 *
 * This wrapper runs Medusa's confirm workflow as a step (so order-
 * change application, payment-collection sync, and the
 * `order-edit.confirmed` event all fire normally), then re-syncs the
 * per-line reservation set from the offer side. For every order item
 * with an `offer.inventory_item_link`, it computes the target
 * reservation set and replaces the existing one. Items without an
 * offer link are left alone.
 *
 * Crucially, each reservation is placed at a stock location that
 * actually has enough availability — keeping the reservation where it
 * already lives when possible, otherwise the first location with
 * sufficient stock. Reserving blindly at the inventory item's first
 * stock level (the previous behavior) made confirm fail with "Not
 * enough stock available for item … at location …" whenever that first
 * level wasn't where the stock was (MER-211).
 */

type OfferLevelRow = {
  location_id?: string | null
  stocked_quantity?: number | null
  reserved_quantity?: number | null
  raw_stocked_quantity?: { value?: string } | null
  raw_reserved_quantity?: { value?: string } | null
}

type OfferLinkRow = {
  required_quantity?: number | null
  inventory_item_id?: string | null
  inventory_item?: {
    id?: string | null
    location_levels?: OfferLevelRow[] | null
  } | null
}

/**
 * Available units at a level: stocked − reserved. Prefer the raw
 * BigNumber values when present so we don't lose precision on large
 * quantities.
 */
const levelAvailable = (lvl: OfferLevelRow): number =>
  Number(
    MathBN.sub(
      lvl.raw_stocked_quantity?.value ?? lvl.stocked_quantity ?? 0,
      lvl.raw_reserved_quantity?.value ?? lvl.reserved_quantity ?? 0
    ).toString()
  )

type CompensationDeleteCreated = {
  type: "delete-created"
  id: string
}

type CompensationRecreatePrior = {
  type: "recreate-prior"
  line_item_id: string | null
  inventory_item_id: string
  location_id: string
  quantity: number
}

type CompensationEntry = CompensationDeleteCreated | CompensationRecreatePrior

const adjustOrderEditReservationsForOffersStepId =
  "mercur-adjust-order-edit-reservations-for-offers"

const adjustOrderEditReservationsForOffersStep = createStep(
  adjustOrderEditReservationsForOffersStepId,
  async (input: { order_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "items.*",
        "items.offer.id",
        "items.offer.inventory_item_link.*",
        "items.offer.inventory_item_link.inventory_item.*",
        "items.offer.inventory_item_link.inventory_item.location_levels.*",
      ],
      filters: { id: input.order_id },
    })

    const order = orders?.[0] as
      | {
          items?: Array<{
            id?: string
            quantity?: number
            fulfilled_quantity?: number
            offer?: { id?: string; inventory_item_link?: OfferLinkRow[] }
          }>
        }
      | undefined

    if (!order?.items?.length) {
      return new StepResponse({ adjusted: false }, [] as CompensationEntry[])
    }

    const inventoryService = container.resolve(Modules.INVENTORY)
    const compensation: CompensationEntry[] = []

    for (const item of order.items) {
      const lineItemId = item.id
      const links = item.offer?.inventory_item_link ?? []
      if (!lineItemId || links.length === 0) {
        continue
      }

      const orderedQuantity = Number(item.quantity ?? 0)
      const fulfilledQuantity = Number(item.fulfilled_quantity ?? 0)
      const reservationQuantity = orderedQuantity - fulfilledQuantity
      if (reservationQuantity <= 0) {
        continue
      }

      // Normalize each offer link to its inventory item + required qty,
      // keeping every stock level (with availability) so we can reserve at a
      // location that actually has stock — not blindly the first level.
      const normalizedLinks = links
        .map((link) => ({
          inventory_item_id:
            link.inventory_item?.id ?? link.inventory_item_id ?? null,
          required_quantity: Number(link.required_quantity ?? 1),
          levels: (link.inventory_item?.location_levels ?? []).filter(
            (lvl): lvl is OfferLevelRow & { location_id: string } =>
              !!lvl.location_id
          ),
        }))
        .filter(
          (
            l
          ): l is {
            inventory_item_id: string
            required_quantity: number
            levels: Array<OfferLevelRow & { location_id: string }>
          } => !!l.inventory_item_id
        )

      if (normalizedLinks.length === 0) {
        continue
      }

      // For inventory items whose levels didn't come back on the offer link
      // (e.g. the nested relation wasn't expanded), fall back to the
      // inventory module so we still know where stock lives and how much is
      // available there.
      const inventoryItemIdsMissingLevels = normalizedLinks
        .filter((l) => l.levels.length === 0)
        .map((l) => l.inventory_item_id)
      if (inventoryItemIdsMissingLevels.length) {
        const levels = await inventoryService.listInventoryLevels({
          inventory_item_id: inventoryItemIdsMissingLevels,
        })
        const levelsByItem = new Map<
          string,
          Array<OfferLevelRow & { location_id: string }>
        >()
        for (const lvl of levels) {
          const itemId = (lvl as { inventory_item_id: string }).inventory_item_id
          const locId = (lvl as { location_id?: string }).location_id
          if (!locId) {
            continue
          }
          const arr = levelsByItem.get(itemId) ?? []
          arr.push({
            location_id: locId,
            stocked_quantity: (lvl as { stocked_quantity?: number })
              .stocked_quantity,
            reserved_quantity: (lvl as { reserved_quantity?: number })
              .reserved_quantity,
          })
          levelsByItem.set(itemId, arr)
        }
        for (const link of normalizedLinks) {
          if (link.levels.length === 0) {
            link.levels = levelsByItem.get(link.inventory_item_id) ?? []
          }
        }
      }

      const existingReservations =
        await inventoryService.listReservationItems({
          line_item_id: lineItemId,
        })

      const existingByInventoryItem = new Map<string, any>()
      for (const r of existingReservations) {
        existingByInventoryItem.set(
          (r as { inventory_item_id: string }).inventory_item_id,
          r
        )
      }

      // Pick the stock location to reserve `desired` units of an inventory
      // item at. Deleting this line's existing reservation frees its units
      // back, so add them back when scoring its current location. Prefer
      // keeping the reservation where it already sits, then any location
      // with enough availability, then a best-effort fallback.
      const pickLocation = (
        link: { inventory_item_id: string; levels: OfferLevelRow[] },
        desired: number
      ): string | null => {
        const existing = existingByInventoryItem.get(link.inventory_item_id) as
          | { location_id?: string; quantity?: number }
          | undefined
        const existingLoc = existing?.location_id ?? null
        const existingQty = Number(existing?.quantity ?? 0)

        const adjustedAvailable = (locId: string): number => {
          const lvl = link.levels.find((l) => l.location_id === locId)
          const base = lvl ? levelAvailable(lvl) : 0
          return base + (existingLoc === locId ? existingQty : 0)
        }

        if (existingLoc && adjustedAvailable(existingLoc) >= desired) {
          return existingLoc
        }
        const fit = link.levels.find(
          (l) => !!l.location_id && adjustedAvailable(l.location_id) >= desired
        )
        if (fit?.location_id) {
          return fit.location_id
        }
        return existingLoc ?? link.levels[0]?.location_id ?? null
      }

      const desiredByInventoryItem = new Map<
        string,
        { quantity: number; location_id: string | null }
      >()
      for (const link of normalizedLinks) {
        const quantity = Number(
          MathBN.mult(reservationQuantity, link.required_quantity).toString()
        )
        desiredByInventoryItem.set(link.inventory_item_id, {
          quantity,
          location_id: pickLocation(link, quantity),
        })
      }

      const allMatch =
        existingReservations.length === desiredByInventoryItem.size &&
        normalizedLinks.every((link) => {
          const existing = existingByInventoryItem.get(link.inventory_item_id)
          if (!existing) return false
          const desiredQty = desiredByInventoryItem.get(link.inventory_item_id)!
            .quantity
          return Number(existing.quantity ?? 0) === desiredQty
        })
      if (allMatch) {
        continue
      }

      const inheritedLocation = existingReservations[0] as
        | { location_id?: string }
        | undefined

      const toCreate = normalizedLinks
        .map((link) => {
          const desired = desiredByInventoryItem.get(link.inventory_item_id)!
          const locationId =
            desired.location_id ?? inheritedLocation?.location_id ?? null
          return {
            line_item_id: lineItemId,
            inventory_item_id: link.inventory_item_id,
            location_id: locationId,
            quantity: desired.quantity,
          }
        })
        .filter(
          (
            r
          ): r is {
            line_item_id: string
            inventory_item_id: string
            location_id: string
            quantity: number
          } => !!r.location_id
        )

      if (toCreate.length === 0) {
        continue
      }

      for (const r of existingReservations) {
        compensation.push({
          type: "recreate-prior",
          line_item_id: lineItemId,
          inventory_item_id: (r as { inventory_item_id: string })
            .inventory_item_id,
          location_id: (r as { location_id: string }).location_id,
          quantity: Number(r.quantity ?? 0),
        })
      }
      if (existingReservations.length) {
        await inventoryService.deleteReservationItems(
          existingReservations.map((r) => r.id)
        )
      }

      const created = await inventoryService.createReservationItems(toCreate)
      for (const r of created) {
        compensation.push({ type: "delete-created", id: r.id })
      }
    }

    return new StepResponse({ adjusted: true }, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation?.length) return
    const inventoryService = container.resolve(Modules.INVENTORY)

    const toDelete = compensation
      .filter((c): c is CompensationDeleteCreated => c.type === "delete-created")
      .map((c) => c.id)
    if (toDelete.length) {
      await inventoryService.deleteReservationItems(toDelete)
    }

    const toRecreate = compensation
      .filter((c): c is CompensationRecreatePrior => c.type === "recreate-prior")
      .map((c) => ({
        line_item_id: c.line_item_id ?? undefined,
        inventory_item_id: c.inventory_item_id,
        location_id: c.location_id,
        quantity: c.quantity,
      }))
    if (toRecreate.length) {
      await inventoryService.createReservationItems(toRecreate)
    }
  }
)

export type ConfirmOrderEditRequestWorkflowInput = {
  order_id: string
  confirmed_by?: string
}

export const confirmOrderEditRequestWorkflowId =
  "mercur-confirm-order-edit-request"

export const confirmOrderEditRequestWorkflow = createWorkflow(
  confirmOrderEditRequestWorkflowId,
  function (
    input: ConfirmOrderEditRequestWorkflowInput
  ): WorkflowResponse<OrderPreviewDTO> {
    const orderPreview = baseConfirmOrderEditRequestWorkflow.runAsStep({
      input: {
        order_id: input.order_id,
        confirmed_by: input.confirmed_by,
      },
    })

    adjustOrderEditReservationsForOffersStep({ order_id: input.order_id })

    return new WorkflowResponse(orderPreview)
  }
)
