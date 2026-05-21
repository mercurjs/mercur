import {
  ContainerRegistrationKeys,
  MathBN,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { addToCartWorkflow } from "../workflows/add-to-cart"
import {
  prepareOfferInventoryInput,
  requiredOfferFieldsForInventoryConfirmation,
} from "../../offer/utils"

/**
 * Read-only stock guard. Fires before line items are created so the
 * caller gets `MedusaError.Codes.INSUFFICIENT_INVENTORY` before any
 * cart mutation.
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

  const foundIds = new Set(offers.map((o: any) => o.id))
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
        "Some inventory item linked to an offer does not have sufficient stock",
        MedusaError.Codes.INSUFFICIENT_INVENTORY,
      )
    }
  }
})
