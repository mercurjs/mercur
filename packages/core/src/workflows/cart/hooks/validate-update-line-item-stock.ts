import {
  ContainerRegistrationKeys,
  MathBN,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { updateLineItemInCartWorkflow } from "../workflows/update-line-item-in-cart"
import {
  prepareOfferInventoryInput,
  requiredOfferFieldsForInventoryConfirmation,
} from "../../offer/utils"

/**
 * Stock guard for quantity updates. Runs against the existing line's
 * linked offer (resolved via the `cart.LineItem ↔ Offer` link). Skips
 * removal calls (`quantity === 0`).
 */
updateLineItemInCartWorkflow.hooks.validate(
  async ({ input, cart }, { container }) => {
    const newQuantity = input.update?.quantity
    if (newQuantity === undefined || newQuantity === null) {
      return
    }
    if (MathBN.lte(newQuantity, 0)) {
      return
    }

    const line = (cart.items ?? []).find((i) => i.id === input.item_id)
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

    for (const entry of confirmInputs) {
      if (entry.allow_backorder) continue
      const requiredQty = MathBN.mult(entry.required_quantity, entry.quantity)
      const hasCoverage = await inventoryService.confirmInventory(
        entry.inventory_item_id,
        entry.location_ids,
        requiredQty,
      )
      if (!hasCoverage) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Cannot increase quantity: an inventory item linked to the offer is out of stock",
          MedusaError.Codes.INSUFFICIENT_INVENTORY,
        )
      }
    }
  },
)
