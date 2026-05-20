import { BigNumberInput } from "@medusajs/framework/types"
import { BigNumber, MathBN, MedusaError } from "@medusajs/framework/utils"

export const requiredOfferFieldsForInventoryConfirmation = [
  "id",
  "inventory_items.inventory_item_id",
  "inventory_items.required_quantity",
  "inventory_items.inventory.location_levels.location_id",
  "inventory_items.inventory.location_levels.stocked_quantity",
  "inventory_items.inventory.location_levels.reserved_quantity",
  "inventory_items.inventory.location_levels.raw_stocked_quantity",
  "inventory_items.inventory.location_levels.raw_reserved_quantity",
  "inventory_items.inventory.location_levels.stock_locations.id",
  "inventory_items.inventory.location_levels.stock_locations.sales_channels.id",
]

export type OfferInventoryLink = {
  inventory_item_id: string
  required_quantity: number
  inventory?: {
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
  inventory_items?: OfferInventoryLink[]
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
  // channel-allowed locations for each (offer_id, inventory_item_id)
  const channelLocations = new Set<string>()
  // every (offer_id, inventory_item_id) → set of location_ids with any level
  const anyLocations = new Map<string, Set<string>>()

  for (const offer of offers) {
    const offerAvail = availability.get(offer.id) ?? new Map()
    availability.set(offer.id, offerAvail)

    for (const link of offer.inventory_items ?? []) {
      const itemAvail = offerAvail.get(link.inventory_item_id) ?? new Map()
      offerAvail.set(link.inventory_item_id, itemAvail)

      const itemAny =
        anyLocations.get(`${offer.id}:${link.inventory_item_id}`) ??
        new Set<string>()
      anyLocations.set(`${offer.id}:${link.inventory_item_id}`, itemAny)

      for (const lvl of link.inventory?.location_levels ?? []) {
        const stocked = MathBN.sub(
          lvl.raw_stocked_quantity ?? lvl.stocked_quantity ?? 0,
          lvl.raw_reserved_quantity ?? lvl.reserved_quantity ?? 0,
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

    const inventoryItems = offer.inventory_items ?? []
    if (!inventoryItems.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Offer ${offerId} has no inventory items linked`,
      )
    }

    for (const link of inventoryItems) {
      const offerAvail = availability.get(offer.id) ?? new Map()
      const itemAvail =
        (offerAvail.get(link.inventory_item_id) as
          | Map<string, BigNumber>
          | undefined) ?? new Map<string, BigNumber>()
      const itemAny =
        anyLocations.get(`${offer.id}:${link.inventory_item_id}`) ?? new Set()

      const required = MathBN.mult(link.required_quantity, item.quantity)

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
        inventory_item_id: link.inventory_item_id,
        required_quantity: link.required_quantity,
        allow_backorder: false,
        quantity: item.quantity,
        location_ids: Array.from(dedup),
      })
    }
  }

  return { items: result }
}
