import { OfferPrice } from "./types"

export const getPriceRegionId = (price: OfferPrice): string | null =>
  price.price_rules?.find((r) => r.attribute === "region_id")?.value ?? null

export const isBasePrice = (price: OfferPrice | null | undefined): price is OfferPrice => {
  if (!price) return false
  const rules = price.price_rules ?? []
  return rules.every((r) => r.attribute === "offer_id")
}

export const isRegionPrice = (
  price: OfferPrice | null | undefined,
  regionId: string,
): price is OfferPrice => {
  if (!price) return false
  const rules = price.price_rules ?? []
  return (
    rules.every((r) => r.attribute === "offer_id" || r.attribute === "region_id") &&
    getPriceRegionId(price) === regionId
  )
}
