import {
  ContainerRegistrationKeys,
  MathBN,
  MedusaError,
  Modules,
  promiseAll,
} from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  prepareOfferInventoryInput,
  requiredOfferFieldsForInventoryConfirmation,
} from "../../offer/utils"

/**
 * Stock availability pre-check. Fires before any cart mutation on
 * `addToCartWorkflow` and `updateLineItemInCartWorkflow`. Throws
 * `MedusaError.Codes.INSUFFICIENT_INVENTORY` if any linked
 * `InventoryItem` cannot cover `quantity * required_quantity` across
 * the cart's sales-channel-visible stock locations.
 *
 * Read-only: does NOT reserve. Reservations live in
 * `beforeRefreshingPaymentCollection` where line items exist and have
 * IDs.
 */

addToCartWorkflow.hooks.validate(async ({ input, cart }, { container }) => {
  const items = input.items ?? []
  if (!items.length) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryService = container.resolve(Modules.INVENTORY)

  const offerIds = Array.from(
    new Set(
      items
        .map((i) => i.offer_id)
        .filter((v): v is string => typeof v === "string" && v.length > 0),
    ),
  )

  if (!offerIds.length) {
    return
  }

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: requiredOfferFieldsForInventoryConfirmation,
    filters: { id: offerIds },
  })

  const foundIds = new Set(offers.map((o: { id: string }) => o.id))
  const missing = offerIds.find((id) => !foundIds.has(id))
  if (missing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer ${missing} not found`,
    )
  }

  const { items: confirmInputs } = prepareOfferInventoryInput({
    input: {
      sales_channel_id: cart.sales_channel_id ?? undefined,
      items: items.map((i) => ({
        id: undefined,
        quantity: i.quantity,
        offer: { id: i.offer_id },
      })),
      offers: offers as never,
    },
  })

  const coverage = await promiseAll(
    confirmInputs
      .filter((entry) => !entry.allow_backorder)
      .map((entry) =>
        inventoryService.confirmInventory(
          entry.inventory_item_id,
          entry.location_ids,
          MathBN.mult(entry.required_quantity, entry.quantity),
        ),
      ),
  )

  if (coverage.some((hasCoverage) => !hasCoverage)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Some inventory item linked to an offer does not have sufficient stock",
      MedusaError.Codes.INSUFFICIENT_INVENTORY,
    )
  }
})

updateLineItemInCartWorkflow.hooks.validate(
  async ({ input, cart }, { container }) => {
    const newQuantity = input.update?.quantity
    if (newQuantity === undefined || newQuantity === null) {
      return
    }
    if (MathBN.lte(newQuantity, 0)) {
      return
    }

    const line = (cart.items ?? []).find(
      (i: { id: string }) => i.id === input.item_id,
    )
    if (!line) {
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const inventoryService = container.resolve(Modules.INVENTORY)

    const { data: cartLines } = await query.graph({
      entity: "line_item",
      fields: ["id", "offer.id"],
      filters: { id: [input.item_id] },
    })
    const offerId = (cartLines[0] as { offer?: { id?: string } } | undefined)
      ?.offer?.id
    if (!offerId) {
      return
    }

    const { data: offers } = await query.graph({
      entity: "offer",
      fields: requiredOfferFieldsForInventoryConfirmation,
      filters: { id: [offerId] },
    })

    const { items: confirmInputs } = prepareOfferInventoryInput({
      input: {
        sales_channel_id: cart.sales_channel_id ?? undefined,
        items: [
          {
            id: input.item_id,
            quantity: newQuantity,
            offer: { id: offerId },
          },
        ],
        offers: offers as never,
      },
    })

    const coverage = await promiseAll(
      confirmInputs
        .filter((entry) => !entry.allow_backorder)
        .map((entry) =>
          inventoryService.confirmInventory(
            entry.inventory_item_id,
            entry.location_ids,
            MathBN.mult(entry.required_quantity, entry.quantity),
          ),
        ),
    )

    if (coverage.some((hasCoverage) => !hasCoverage)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot increase quantity: an inventory item linked to the offer is out of stock",
        MedusaError.Codes.INSUFFICIENT_INVENTORY,
      )
    }
  },
)
