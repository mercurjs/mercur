import { MedusaStoreRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { OfferDTO } from "@mercurjs/types"

type OfferOnVariant = OfferDTO & {
  inventory_quantity?: number | null
  in_stock?: boolean
}

type VariantInput = {
  id: string
  offers?: OfferOnVariant[]
}

type OfferInventoryLinkRow = {
  required_quantity?: number
  inventory_item: { id: string } | null
}

type OfferWithInventory = Pick<OfferDTO, "id"> & {
  inventory_item_link?: OfferInventoryLinkRow[]
}

type InventoryLevelRow = {
  inventory_item_id: string
  stocked_quantity?: number | null
  reserved_quantity?: number | null
}

export const wrapVariantsWithOffersInventory = async (
  req: MedusaStoreRequest,
  variants: VariantInput[],
) => {
  const variantIds = (variants ?? []).map((v) => v.id)
  if (!variantIds.length) {
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // If the pricing wrap didn't run first, the variants have no
  // `offers[]` attached yet. Fetch the offer skeleton ourselves so we
  // can populate `inventory_quantity` even when only the inventory
  // field was requested.
  const needsOfferBootstrap = variants.some(
    (v) => !v.offers || v.offers.length === 0,
  )

  if (needsOfferBootstrap) {
    const { data: offers } = await query.graph({
      entity: "offer",
      fields: [
        "id",
        "variant_id",
        "seller_id",
        "shipping_profile_id",
        "price_set_id",
        "sku",
        "ean",
        "upc",
        "deleted_at",
      ],
      filters: { variant_id: variantIds },
    })

    const liveOffers = (offers ?? []).filter(
      (o: { deleted_at: string | null }) => !o.deleted_at,
    ) as OfferOnVariant[]

    const offersByVariant = new Map<string, OfferOnVariant[]>()
    for (const offer of liveOffers) {
      const list = offersByVariant.get(offer.variant_id) ?? []
      list.push(offer)
      offersByVariant.set(offer.variant_id, list)
    }

    for (const variant of variants) {
      if (!variant.offers || variant.offers.length === 0) {
        variant.offers = offersByVariant.get(variant.id) ?? []
      }
    }
  }

  const offerIds = variants
    .flatMap((v) => v.offers ?? [])
    .map((o) => o.id)

  if (!offerIds.length) {
    for (const variant of variants) {
      variant.offers = variant.offers ?? []
    }
    return
  }

  // Resolve channel-visible locations BEFORE we fetch levels so the
  // level query itself can be filtered at the DB. A single sales
  // channel can fan out to thousands of seller locations; fetching
  // every `location_level` of every linked inventory item and then
  // filtering in JS is the path we're explicitly avoiding here.
  const channelLocationIds = await resolveSalesChannelLocationIds(req)

  // Channel has zero linked locations -> nothing on this storefront
  // surface can be in stock. Short-circuit without touching levels.
  if (channelLocationIds && channelLocationIds.size === 0) {
    for (const variant of variants) {
      const offers = variant.offers ?? []
      for (const offer of offers) {
        offer.inventory_quantity = 0
        offer.in_stock = false
      }
      variant.offers = []
    }
    return
  }

  // Pull the offer → inventory_item pivot rows. We deliberately do NOT
  // request `location_levels.*` here — we fetch those next, narrowed
  // by channel location at the DB layer.
  const { data: offerInventory } = await query.graph({
    entity: "offer",
    fields: [
      "id",
      "inventory_item_link.required_quantity",
      "inventory_item_link.inventory_item.id",
    ],
    filters: { id: offerIds },
  })

  const linksByOffer = new Map<string, OfferInventoryLinkRow[]>()
  const inventoryItemIds = new Set<string>()
  for (const row of (offerInventory ?? []) as OfferWithInventory[]) {
    const rows = row.inventory_item_link ?? []
    linksByOffer.set(row.id, rows)
    for (const link of rows) {
      if (link.inventory_item?.id) {
        inventoryItemIds.add(link.inventory_item.id)
      }
    }
  }

  // Fetch only the levels we'll consume. The `location_id` filter is
  // the whole reason we resolved channel locations up-front — without
  // it, this query would return every level for every linked item
  // regardless of which sales channel the shopper is browsing through.
  const levelsByItem = new Map<string, InventoryLevelRow[]>()
  if (inventoryItemIds.size) {
    const levelFilters: Record<string, unknown> = {
      inventory_item_id: Array.from(inventoryItemIds),
    }
    if (channelLocationIds) {
      levelFilters.location_id = Array.from(channelLocationIds)
    }

    const { data: levels } = await query.graph({
      entity: "inventory_level",
      fields: ["inventory_item_id", "stocked_quantity", "reserved_quantity"],
      filters: levelFilters,
    })

    for (const lvl of (levels ?? []) as InventoryLevelRow[]) {
      const list = levelsByItem.get(lvl.inventory_item_id) ?? []
      list.push(lvl)
      levelsByItem.set(lvl.inventory_item_id, list)
    }
  }

  for (const variant of variants) {
    const offers = variant.offers ?? []
    for (const offer of offers) {
      const links = linksByOffer.get(offer.id) ?? []
      offer.inventory_quantity = computeOfferAvailability(links, levelsByItem)
      offer.in_stock = (offer.inventory_quantity ?? 0) > 0
    }
    variant.offers = offers.filter((o) => o.in_stock)
  }
}

const computeOfferAvailability = (
  links: OfferInventoryLinkRow[],
  levelsByItem: Map<string, InventoryLevelRow[]>,
): number | null => {
  if (!links.length) {
    return null
  }

  const perItem: number[] = []
  for (const link of links) {
    const required = link.required_quantity || 1
    const itemId = link.inventory_item?.id
    const levels = itemId ? (levelsByItem.get(itemId) ?? []) : []
    const available = levels.reduce((sum, level) => {
      const stocked = Number(level.stocked_quantity ?? 0)
      const reserved = Number(level.reserved_quantity ?? 0)
      return sum + Math.max(0, stocked - reserved)
    }, 0)
    perItem.push(Math.floor(available / required))
  }

  return perItem.length ? Math.min(...perItem) : null
}

const resolveSalesChannelLocationIds = async (
  req: MedusaStoreRequest,
): Promise<Set<string> | null> => {
  const salesChannelIds =
    req.publishable_key_context?.sales_channel_ids ?? []
  if (!salesChannelIds.length) {
    return null
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: channelLocations } = await query.graph({
    entity: "sales_channel_locations",
    fields: ["stock_location_id"],
    filters: { sales_channel_id: salesChannelIds },
  })

  const ids = new Set<string>()
  for (const row of (channelLocations ?? []) as Array<{
    stock_location_id: string
  }>) {
    ids.add(row.stock_location_id)
  }
  return ids
}
