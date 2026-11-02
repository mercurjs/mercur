import { BigNumberInput, MedusaContainer } from "@medusajs/framework/types"
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
  OfferInventoryShape,
  prepareOfferInventoryInput,
  requiredOfferFieldsForInventoryConfirmation,
} from "../../offer/utils"

type OfferDemandLine = {
  id: string
  quantity: BigNumberInput
  offer_id: string
}

const resolveCartOfferLines = async (
  container: MedusaContainer,
  cartId: string,
): Promise<OfferDemandLine[]> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: ["items.id", "items.quantity", "items.offer.id"],
    filters: { id: cartId },
  })

  const items = (data[0]?.items ?? []) as Array<{
    id: string
    quantity: BigNumberInput
    offer?: { id?: string } | null
  } | null>

  return items.flatMap((item) =>
    item?.offer?.id
      ? [{ id: item.id, quantity: item.quantity, offer_id: item.offer.id }]
      : [],
  )
}

// Several lines can draw on one inventory item: the same offer added again
// before Medusa merges it, or different offers sharing an item through
// inventory kits. Stock is confirmed against the cart's total demand per item,
// not line by line.
const hasCartOfferInventoryCoverage = async ({
  container,
  salesChannelId,
  lines,
  checkedLineIds,
}: {
  container: MedusaContainer
  salesChannelId?: string
  lines: OfferDemandLine[]
  checkedLineIds: Set<string>
}): Promise<boolean> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryService = container.resolve(Modules.INVENTORY)

  const offerIds = Array.from(new Set(lines.map((l) => l.offer_id)))
  const { data: offers } = await query.graph({
    entity: "offer",
    fields: requiredOfferFieldsForInventoryConfirmation,
    filters: { id: offerIds },
  })

  const foundIds = new Set(offers.map((o: { id: string }) => o.id))
  const missing = lines.find(
    (l) => checkedLineIds.has(l.id) && !foundIds.has(l.offer_id),
  )
  if (missing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer ${missing.offer_id} not found`,
    )
  }

  const { items: entries } = prepareOfferInventoryInput({
    input: {
      sales_channel_id: salesChannelId,
      items: lines
        .filter((l) => foundIds.has(l.offer_id))
        .map((l) => ({
          id: l.id,
          quantity: l.quantity,
          offer: { id: l.offer_id },
        })),
      offers: offers as OfferInventoryShape[],
    },
  })

  const demandByItem = new Map<
    string,
    { units: BigNumberInput; locationIds: Set<string>; checked: boolean }
  >()

  for (const entry of entries) {
    if (!entry.manage_inventory) {
      continue
    }

    const demand = demandByItem.get(entry.inventory_item_id) ?? {
      units: 0,
      locationIds: new Set<string>(),
      checked: false,
    }
    demand.units = MathBN.add(
      demand.units,
      MathBN.mult(entry.required_quantity, entry.quantity),
    )
    if (
      entry.id &&
      checkedLineIds.has(entry.id) &&
      !entry.allow_backorder
    ) {
      demand.checked = true
      entry.location_ids.forEach((id) => demand.locationIds.add(id))
    }
    demandByItem.set(entry.inventory_item_id, demand)
  }

  const coverage = await promiseAll(
    Array.from(demandByItem.entries())
      .filter(([, demand]) => demand.checked)
      .map(([inventoryItemId, demand]) =>
        inventoryService.confirmInventory(
          inventoryItemId,
          Array.from(demand.locationIds),
          demand.units,
        ),
      ),
  )

  return coverage.every(Boolean)
}

addToCartWorkflow.hooks.validate(async ({ input, cart }, { container }) => {
  const incoming = (input.items ?? []).filter(
    (i): i is typeof i & { offer_id: string } =>
      typeof i.offer_id === "string" && i.offer_id.length > 0,
  )
  if (!incoming.length) {
    return
  }

  const incomingLines = incoming.map((i, index) => ({
    id: `incoming_${index}`,
    quantity: i.quantity,
    offer_id: i.offer_id,
  }))
  const existingLines = await resolveCartOfferLines(container, cart.id)

  const covered = await hasCartOfferInventoryCoverage({
    container,
    salesChannelId: cart.sales_channel_id ?? undefined,
    lines: [...existingLines, ...incomingLines],
    checkedLineIds: new Set(incomingLines.map((l) => l.id)),
  })

  if (!covered) {
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

    const lines = (
      await resolveCartOfferLines(container, cart.id)
    ).map((l) =>
      l.id === input.item_id ? { ...l, quantity: newQuantity } : l,
    )
    if (!lines.some((l) => l.id === input.item_id)) {
      return
    }

    const covered = await hasCartOfferInventoryCoverage({
      container,
      salesChannelId: cart.sales_channel_id ?? undefined,
      lines,
      checkedLineIds: new Set([input.item_id]),
    })

    if (!covered) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot increase quantity: an inventory item linked to the offer is out of stock",
        MedusaError.Codes.INSUFFICIENT_INVENTORY,
      )
    }
  },
)
