import { HttpTypes } from "@medusajs/types"

type SellerRef = { id: string } | null

export type StockGridOffer = {
  seller_id: string
  product_variant?: {
    product?: { title?: string | null } | null
  } | null
}

export type StockGridItem = HttpTypes.AdminInventoryItem & {
  seller?: SellerRef
  offers?: StockGridOffer[] | null
}

export type StockGridLocation = HttpTypes.AdminStockLocation & {
  seller?: SellerRef
}

export const getItemSellerIds = (item: StockGridItem): Set<string> => {
  const ids = new Set<string>()

  if (item.seller?.id) {
    ids.add(item.seller.id)
  }

  for (const offer of item.offers ?? []) {
    if (offer.seller_id) {
      ids.add(offer.seller_id)
    }
  }

  return ids
}

export const getOfferTitle = (item: StockGridItem): string | undefined =>
  item.offers?.[0]?.product_variant?.product?.title ?? undefined

export const isForeignLocation = (
  item: StockGridItem,
  location: StockGridLocation
): boolean => {
  const locationSellerId = location.seller?.id

  if (!locationSellerId) {
    return false
  }

  const itemSellerIds = getItemSellerIds(item)

  if (itemSellerIds.size === 0) {
    return false
  }

  return !itemSellerIds.has(locationSellerId)
}

export const scopeLocationsToItems = (
  items: StockGridItem[],
  locations: StockGridLocation[]
): StockGridLocation[] => {
  const sellerIds = new Set<string>()

  for (const item of items) {
    for (const id of getItemSellerIds(item)) {
      sellerIds.add(id)
    }
  }

  return locations.filter(
    (location) => !!location.seller?.id && sellerIds.has(location.seller.id)
  )
}
