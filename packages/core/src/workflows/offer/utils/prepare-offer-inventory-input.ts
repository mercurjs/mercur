import { BigNumberInput } from "@medusajs/framework/types"
import { BigNumber, MathBN, MedusaError } from "@medusajs/framework/utils"

// `defineLink(...isList: true, isList: true, { extraColumns })` exposes
// the pivot row on the writable side under the `<entity>_link` alias
// (here: `offer.inventory_item_link[]`). Each row carries the pivot's
// `id`, `required_quantity` (extra column), the foreign keys, and a
// nested `inventory_item` relationship to the linked `InventoryItem`.
// We must request fields off the pivot to get `required_quantity`; the
// `offer.inventory_items[]` shortcut flattens to the `InventoryItem`
// rows directly and does not expose pivot columns.
export const requiredOfferFieldsForInventoryConfirmation = [
  "id",
  "inventory_item_link.required_quantity",
  "inventory_item_link.inventory_item.id",
  "inventory_item_link.inventory_item.location_levels.location_id",
  "inventory_item_link.inventory_item.location_levels.stocked_quantity",
  "inventory_item_link.inventory_item.location_levels.reserved_quantity",
  "inventory_item_link.inventory_item.location_levels.raw_stocked_quantity",
  "inventory_item_link.inventory_item.location_levels.raw_reserved_quantity",
  "inventory_item_link.inventory_item.location_levels.stock_locations.id",
  "inventory_item_link.inventory_item.location_levels.stock_locations.sales_channels.id",
]

export type OfferInventoryItemLinkRow = {
  required_quantity?: number
  inventory_item: {
    id: string
    location_levels?: Array<{
      location_id: string
      stocked_quantity?: BigNumberInput
      reserved_quantity?: BigNumberInput
      raw_stocked_quantity?: BigNumberInput
      raw_reserved_quantity?: BigNumberInput
      stock_locations?: Array<{
        id: string
        sales_channels?: Array<{ id: string }>
      }>
    }>
  }
}

export type OfferInventoryShape = {
  id: string
  inventory_item_link?: OfferInventoryItemLinkRow[]
}

export type PrepareOfferInventoryInputData = {
  input: {
    sales_channel_id?: string
    items: Array<{
      id?: string
      quantity: BigNumberInput
      offer?: { id: string } | null
    }>
    offers: OfferInventoryShape[]
  }
}

export type OfferConfirmInventoryItem = {
  id?: string
  inventory_item_id: string
  required_quantity: number
  allow_backorder: boolean
  quantity: BigNumberInput
  location_ids: string[]
}

/**
 * Mercur replacement for Medusa's `prepareConfirmInventoryInput`. Resolves
 * each cart line by its linked offer (via `item.offer.id`) and fans out
 * one entry per (line, linked inventory_item) pair. Output is the same
 * shape Medusa's `confirmInventoryStep` / `reserveInventoryStep` expect.
 *
 * `allow_backorder` is always `false` — the offer module does not expose
 * a backorder flag and the variant-level field has been dropped on
 * Mercur's product schema.
 */
export const prepareOfferInventoryInput = (
  data: PrepareOfferInventoryInputData,
): { items: OfferConfirmInventoryItem[] } => {
  const { sales_channel_id, items, offers } = data.input

  if (!items?.length) {
    return { items: [] }
  }

  // (offer_id) → offer
  const offerById = new Map<string, OfferInventoryShape>(
    offers.map((o) => [o.id, o]),
  )

  // (offer_id, inventory_item_id, location_id) → availability
  const availability = new Map<string, Map<string, Map<string, BigNumber>>>()
  // channel-allowed locations across all offers in the batch
  const channelLocations = new Set<string>()
  // every (offer_id, inventory_item_id) → set of location_ids with any level
  const anyLocations = new Map<string, Set<string>>()
  // (offer_id, inventory_item_id) → required_quantity from the pivot row
  const requiredByPivot = new Map<string, number>()

  for (const offer of offers) {
    const offerAvail = availability.get(offer.id) ?? new Map()
    availability.set(offer.id, offerAvail)

    for (const link of offer.inventory_item_link ?? []) {
      const inventoryItemId = link.inventory_item.id
      const itemAvail = offerAvail.get(inventoryItemId) ?? new Map()
      offerAvail.set(inventoryItemId, itemAvail)

      const itemAny =
        anyLocations.get(`${offer.id}:${inventoryItemId}`) ??
        new Set<string>()
      anyLocations.set(`${offer.id}:${inventoryItemId}`, itemAny)

      requiredByPivot.set(
        `${offer.id}:${inventoryItemId}`,
        link.required_quantity ?? 1,
      )

      for (const lvl of link.inventory_item.location_levels ?? []) {
        const stocked = MathBN.sub(
          (lvl.raw_stocked_quantity as any)?.value ??
            lvl.stocked_quantity ??
            0,
          (lvl.raw_reserved_quantity as any)?.value ??
            lvl.reserved_quantity ??
            0,
        )
        itemAvail.set(lvl.location_id, new BigNumber(stocked))
        itemAny.add(lvl.location_id)

        for (const sl of lvl.stock_locations ?? []) {
          if (
            sales_channel_id &&
            sl.sales_channels?.some((sc) => sc.id === sales_channel_id)
          ) {
            channelLocations.add(sl.id)
          }
        }
      }
    }
  }

  const result: OfferConfirmInventoryItem[] = []

  for (const item of items) {
    const offerId = item.offer?.id
    if (!offerId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "prepareOfferInventoryInput received a cart item with no resolved offer",
      )
    }

    const offer = offerById.get(offerId)
    if (!offer) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Offer ${offerId} could not be resolved for the inventory check`,
      )
    }

    const inventoryLinks = offer.inventory_item_link ?? []
    if (!inventoryLinks.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Offer ${offerId} has no inventory items linked`,
      )
    }

    for (const link of inventoryLinks) {
      const inventoryItemId = link.inventory_item.id
      const offerAvail = availability.get(offer.id) ?? new Map()
      const itemAvail =
        (offerAvail.get(inventoryItemId) as
          | Map<string, BigNumber>
          | undefined) ?? new Map<string, BigNumber>()
      const itemAny =
        anyLocations.get(`${offer.id}:${inventoryItemId}`) ?? new Set()

      const requiredQuantity =
        requiredByPivot.get(`${offer.id}:${inventoryItemId}`) ?? 1
      const required = MathBN.mult(requiredQuantity, item.quantity)

      // 1. Full availability locations
      const fullLocations: string[] = []
      for (const [locId, qty] of itemAvail) {
        if (MathBN.gte(qty, required)) {
          fullLocations.push(locId)
        }
      }

      // 2. Locations with any level for this item
      const anyLocationsArr = Array.from(itemAny)

      // 3. Channel-allowed locations
      const channelLocationsArr = Array.from(channelLocations)

      const dedup = new Set<string>([
        ...fullLocations,
        ...anyLocationsArr,
        ...channelLocationsArr,
      ])

      result.push({
        id: item.id,
        inventory_item_id: inventoryItemId,
        required_quantity: requiredQuantity,
        allow_backorder: false,
        quantity: item.quantity,
        location_ids: Array.from(dedup),
      })
    }
  }

  return { items: result }
}
