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
 * Mercur wrapper around Medusa's `confirmOrderEditRequestWorkflow`. Mirror of
 * `mercur-confirm-exchange-request` / `-claim-request` for the order-edit
 * path. Medusa's confirm step calls `reserveInventoryStep` keyed by the
 * variant's `inventory_items`; when an order edit adds a Mercur offer-backed
 * line, the variant has no Medusa-side inventory items so no reservation
 * is created. This step tops up reservations against the offer's
 * `inventory_item_link[]` for any line where pending (unfulfilled) quantity
 * exceeds the existing reservation total.
 *
 * Called from `/admin/order-edits/:id/confirm` and
 * `/vendor/order-edits/:id/confirm`.
 */

type OfferLinkRow = {
  required_quantity?: number | null
  inventory_item_id?: string | null
  inventory_item?: {
    id?: string | null
    location_levels?: Array<{ location_id?: string | null } | null> | null
  } | null
}

type CreatedReservationCompensation = {
  type: "delete"
  id: string
}

const topUpOrderEditReservationsForOffersStepId =
  "mercur-top-up-order-edit-reservations-for-offers"

const topUpOrderEditReservationsForOffersStep = createStep(
  topUpOrderEditReservationsForOffersStepId,
  async (input: { order_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "items.id",
        "items.quantity",
        "items.raw_quantity",
        "items.detail.fulfilled_quantity",
        "items.detail.raw_fulfilled_quantity",
        "items.offer.id",
        "items.offer.inventory_item_link.required_quantity",
        "items.offer.inventory_item_link.inventory_item_id",
        "items.offer.inventory_item_link.inventory_item.id",
        "items.offer.inventory_item_link.inventory_item.location_levels.location_id",
      ],
      filters: { id: input.order_id },
    })

    const order = orders?.[0] as
      | {
          items?: Array<{
            id?: string
            quantity?: number
            raw_quantity?: number
            detail?: {
              fulfilled_quantity?: number
              raw_fulfilled_quantity?: number
            } | null
            offer?: {
              id?: string
              inventory_item_link?: OfferLinkRow[]
            } | null
          }>
        }
      | undefined

    if (!order?.items?.length) {
      return new StepResponse(
        { created: 0 },
        [] as CreatedReservationCompensation[]
      )
    }

    const inventoryService = container.resolve(Modules.INVENTORY)
    const compensation: CreatedReservationCompensation[] = []

    for (const item of order.items) {
      const lineItemId = item.id
      const links = item.offer?.inventory_item_link ?? []
      if (!lineItemId || links.length === 0) {
        continue
      }

      const orderedQuantity = Number(item.raw_quantity ?? item.quantity ?? 0)
      const fulfilledQuantity = Number(
        item.detail?.raw_fulfilled_quantity ??
          item.detail?.fulfilled_quantity ??
          0
      )
      const pendingQuantity = orderedQuantity - fulfilledQuantity
      if (pendingQuantity <= 0) {
        continue
      }

      const normalizedLinks = links
        .map((link) => ({
          inventory_item_id:
            link.inventory_item?.id ?? link.inventory_item_id ?? null,
          required_quantity: Number(link.required_quantity ?? 1),
          location_ids: (link.inventory_item?.location_levels ?? [])
            .map((lvl) => lvl?.location_id ?? null)
            .filter((id): id is string => !!id),
        }))
        .filter(
          (
            l
          ): l is {
            inventory_item_id: string
            required_quantity: number
            location_ids: string[]
          } => !!l.inventory_item_id
        )

      if (normalizedLinks.length === 0) {
        continue
      }

      // Use an existing reservation's location_id when present (keeps a
      // mixed-fulfillment line consistent); otherwise fall back to the
      // first location_level on the linked inventory item.
      const existingOnLine = await inventoryService.listReservationItems({
        line_item_id: lineItemId,
      })
      const fallbackLocationId = (
        existingOnLine[0] as { location_id?: string } | undefined
      )?.location_id

      for (const link of normalizedLinks) {
        const desiredQuantity = Number(
          MathBN.mult(pendingQuantity, link.required_quantity).toString()
        )

        const existing = await inventoryService.listReservationItems({
          line_item_id: lineItemId,
          inventory_item_id: link.inventory_item_id,
        })
        const existingQuantity = existing.reduce(
          (sum, r) => sum + Number(r.quantity ?? 0),
          0
        )
        const missingQuantity = desiredQuantity - existingQuantity
        if (missingQuantity <= 0) {
          continue
        }

        const locationId = fallbackLocationId ?? link.location_ids[0]
        if (!locationId) {
          continue
        }

        const [created] = await inventoryService.createReservationItems([
          {
            line_item_id: lineItemId,
            inventory_item_id: link.inventory_item_id,
            location_id: locationId,
            quantity: missingQuantity,
          },
        ])
        if (created?.id) {
          compensation.push({ type: "delete", id: created.id })
        }
      }
    }

    return new StepResponse({ created: compensation.length }, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation?.length) return
    const inventoryService = container.resolve(Modules.INVENTORY)
    await inventoryService.deleteReservationItems(
      compensation.map((c) => c.id)
    )
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

    topUpOrderEditReservationsForOffersStep({ order_id: input.order_id })

    return new WorkflowResponse(orderPreview)
  }
)
