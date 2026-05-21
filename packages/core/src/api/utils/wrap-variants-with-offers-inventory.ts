import { MedusaStoreRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type OfferOnVariant = {
  id: string
  variant_id: string
  seller_id?: string
  shipping_profile_id?: string
  price_set_id?: string
  sku?: string
  ean?: string | null
  upc?: string | null
  inventory_quantity?: number | null
  in_stock?: boolean
}

type VariantInput = {
  id: string
  offers?: OfferOnVariant[]
}

type OfferInventoryLinkRow = {
  required_quantity?: number
  inventory_item: {
    id: string
    location_levels?: Array<{
      location_id: string
      stocked_quantity?: number
      reserved_quantity?: number
    }>
  } | null
}

type OfferWithInventory = {
  id: string
  inventory_item_link?: OfferInventoryLinkRow[]
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

  const { data: offerInventory } = await query.graph({
    entity: "offer",
    fields: [
      "id",
      "inventory_item_link.required_quantity",
      "inventory_item_link.inventory_item.id",
      "inventory_item_link.inventory_item.location_levels.location_id",
      "inventory_item_link.inventory_item.location_levels.stocked_quantity",
      "inventory_item_link.inventory_item.location_levels.reserved_quantity",
    ],
    filters: { id: offerIds },
  })

  const channelLocationIds = await resolveSalesChannelLocationIds(req)

  const linksByOffer = new Map<string, OfferInventoryLinkRow[]>()
  for (const row of (offerInventory ?? []) as OfferWithInventory[]) {
    linksByOffer.set(row.id, row.inventory_item_link ?? [])
  }

  for (const variant of variants) {
    const offers = variant.offers ?? []
    for (const offer of offers) {
      const links = linksByOffer.get(offer.id) ?? []
      offer.inventory_quantity = computeOfferAvailability(
        links,
        channelLocationIds,
      )
      offer.in_stock = (offer.inventory_quantity ?? 0) > 0
    }
    variant.offers = offers.filter((o) => o.in_stock)
  }
}

const computeOfferAvailability = (
  links: OfferInventoryLinkRow[],
  channelLocationIds: Set<string> | null,
): number | null => {
  if (!links.length) {
    return null
  }

  const perItem: number[] = []
  for (const link of links) {
    const required = link.required_quantity || 1
    const levels = link.inventory_item?.location_levels ?? []
    const available = levels.reduce((sum, level) => {
      if (
        channelLocationIds &&
        !channelLocationIds.has(level.location_id)
      ) {
        return sum
      }
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
