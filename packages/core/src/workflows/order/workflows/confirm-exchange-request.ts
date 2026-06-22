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
import { confirmExchangeRequestWorkflow as baseConfirmExchangeRequestWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Mercur wrapper around Medusa's `confirmExchangeRequestWorkflow`.
 *
 * Background. In Mercur, inventory ownership lives on the **offer**, not on
 * the variant. The `offer ↔ inventory_item` join carries a
 * `required_quantity` column (default `1`) that lets a single offer sale
 * consume N units of a linked inventory item (think bundles / multi-SKU
 * kits). Medusa's `confirmExchangeRequestWorkflow` calls `reserveInventoryStep`
 * keyed by the variant's inventory item with `quantity × 1`, so any outbound
 * exchange item whose offer has `required_quantity > 1` is under-reserved,
 * and a bundle offer (`inventory_item_link.length > 1`) only reserves the
 * variant's primary inventory item.
 *
 * This wrapper runs Medusa's confirm workflow as a step (so all of Medusa's
 * logic — return creation, change confirmation, payment-collection sync,
 * exchange shipping fulfilment, the `order.exchange_created` event — runs
 * unchanged), then walks the reservations Medusa just created and either:
 *  - Updates the single existing reservation's quantity (single-link case
 *    with `required_quantity > 1`), or
 *  - Deletes Medusa's variant-keyed reservation set and creates one new
 *    reservation per `inventory_item_link` row (bundle case).
 *
 * Called from `packages/core/src/api/vendor/exchanges/[id]/request/route.ts`.
 */

type OfferLinkRow = {
  required_quantity?: number | null
  inventory_item_id?: string | null
  inventory_item?: { id?: string | null } | null
}

type CompensationUpdate = {
  type: "update"
  id: string
  quantity: number
}

type CompensationDelete = {
  type: "create"
  line_item_id: string | null
  inventory_item_id: string
  location_id: string
  quantity: number
}

type CompensationCreate = {
  type: "delete"
  id: string
}

type CompensationEntry =
  | CompensationUpdate
  | CompensationDelete
  | CompensationCreate

const adjustExchangeReservationsForOffersStepId =
  "mercur-adjust-exchange-reservations-for-offers"

const adjustExchangeReservationsForOffersStep = createStep(
  adjustExchangeReservationsForOffersStepId,
  async (input: { exchange_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: exchanges } = await query.graph({
      entity: "order_exchange",
      fields: [
        "id",
        "additional_items.quantity",
        "additional_items.raw_quantity",
        "additional_items.item.id",
        "additional_items.item.offer.id",
        "additional_items.item.offer.inventory_item_link.required_quantity",
        "additional_items.item.offer.inventory_item_link.inventory_item_id",
        "additional_items.item.offer.inventory_item_link.inventory_item.id",
      ],
      filters: { id: input.exchange_id },
    })

    const exchange = exchanges?.[0] as
      | {
          additional_items?: Array<{
            quantity?: number
            raw_quantity?: number
            item?: {
              id?: string
              offer?: { id?: string; inventory_item_link?: OfferLinkRow[] }
            }
          }>
        }
      | undefined

    if (!exchange?.additional_items?.length) {
      return new StepResponse({ adjusted: false }, [] as CompensationEntry[])
    }

    const inventoryService = container.resolve(Modules.INVENTORY)
    const compensation: CompensationEntry[] = []

    for (const ai of exchange.additional_items) {
      const lineItemId = ai.item?.id
      const links = ai.item?.offer?.inventory_item_link ?? []
      if (!lineItemId || links.length === 0) {
        continue
      }

      const orderedQuantity = Number(ai.raw_quantity ?? ai.quantity ?? 0)
      if (!orderedQuantity) {
        continue
      }

      // Normalize links: drop entries missing an inventory_item_id; default
      // required_quantity to 1.
      const normalizedLinks = links
        .map((link) => ({
          inventory_item_id:
            link.inventory_item?.id ?? link.inventory_item_id ?? null,
          required_quantity: Number(link.required_quantity ?? 1),
        }))
        .filter(
          (l): l is { inventory_item_id: string; required_quantity: number } =>
            !!l.inventory_item_id
        )

      if (normalizedLinks.length === 0) {
        continue
      }

      // Single-link case: keep Medusa's reservation, update its quantity.
      if (normalizedLinks.length === 1) {
        const link = normalizedLinks[0]
        if (link.required_quantity === 1) {
          continue
        }
        const reservations = await inventoryService.listReservationItems({
          line_item_id: lineItemId,
          inventory_item_id: link.inventory_item_id,
        })
        const targetQuantity = Number(
          MathBN.mult(orderedQuantity, link.required_quantity).toString()
        )
        const toUpdate: Array<{ id: string; quantity: number }> = []
        for (const r of reservations) {
          const currentQuantity = Number(r.quantity ?? 0)
          if (currentQuantity === targetQuantity) continue
          toUpdate.push({ id: r.id, quantity: targetQuantity })
          compensation.push({
            type: "update",
            id: r.id,
            quantity: currentQuantity,
          })
        }
        if (toUpdate.length) {
          await inventoryService.updateReservationItems(toUpdate)
        }
        continue
      }

      // Bundle case (links.length > 1): delete Medusa's variant-keyed
      // reservation(s) and create one per offer inventory_item_link.
      const existingReservations =
        await inventoryService.listReservationItems({
          line_item_id: lineItemId,
        })
      if (existingReservations.length === 0) {
        continue
      }
      // All existing reservations should share a location_id — Medusa picks
      // one stock location per line item at confirm time. Use the first as
      // the canonical location for the new bundle reservations.
      const locationId = (existingReservations[0] as { location_id: string })
        .location_id
      if (!locationId) {
        continue
      }

      // Stash existing reservations for compensation (re-create on rollback).
      for (const r of existingReservations) {
        compensation.push({
          type: "create",
          line_item_id: lineItemId,
          inventory_item_id: (r as { inventory_item_id: string })
            .inventory_item_id,
          location_id: (r as { location_id: string }).location_id,
          quantity: Number(r.quantity ?? 0),
        })
      }

      await inventoryService.deleteReservationItems(
        existingReservations.map((r) => r.id)
      )

      const newReservations = normalizedLinks.map((link) => ({
        line_item_id: lineItemId,
        inventory_item_id: link.inventory_item_id,
        location_id: locationId,
        quantity: Number(
          MathBN.mult(orderedQuantity, link.required_quantity).toString()
        ),
      }))
      const created = await inventoryService.createReservationItems(
        newReservations
      )
      // Stash created ids for compensation (delete on rollback).
      for (const r of created) {
        compensation.push({ type: "delete", id: r.id })
      }
    }

    return new StepResponse({ adjusted: true }, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation?.length) return
    const inventoryService = container.resolve(Modules.INVENTORY)

    const updates = compensation
      .filter((c): c is CompensationUpdate => c.type === "update")
      .map((c) => ({ id: c.id, quantity: c.quantity }))
    if (updates.length) {
      await inventoryService.updateReservationItems(updates)
    }

    const toDelete = compensation
      .filter((c): c is CompensationCreate => c.type === "delete")
      .map((c) => c.id)
    if (toDelete.length) {
      await inventoryService.deleteReservationItems(toDelete)
    }

    const toCreate = compensation
      .filter((c): c is CompensationDelete => c.type === "create")
      .map((c) => ({
        line_item_id: c.line_item_id ?? undefined,
        inventory_item_id: c.inventory_item_id,
        location_id: c.location_id,
        quantity: c.quantity,
      }))
    if (toCreate.length) {
      await inventoryService.createReservationItems(toCreate)
    }
  }
)

export type ConfirmExchangeRequestWorkflowInput = {
  exchange_id: string
  confirmed_by?: string
}

export const confirmExchangeRequestWorkflowId =
  "mercur-confirm-exchange-request"

export const confirmExchangeRequestWorkflow = createWorkflow(
  confirmExchangeRequestWorkflowId,
  function (
    input: ConfirmExchangeRequestWorkflowInput
  ): WorkflowResponse<OrderPreviewDTO> {
    const orderPreview = baseConfirmExchangeRequestWorkflow.runAsStep({
      input: {
        exchange_id: input.exchange_id,
        confirmed_by: input.confirmed_by,
      },
    })

    adjustExchangeReservationsForOffersStep({ exchange_id: input.exchange_id })

    return new WorkflowResponse(orderPreview)
  }
)
