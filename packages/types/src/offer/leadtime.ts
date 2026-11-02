/**
 * The marketplace-wide default lives in the Medusa store's metadata under this
 * key, edited from Settings → Marketplace in the admin.
 */
export const MARKETPLACE_DEFAULT_LEADTIME_KEY = "default_leadtime_to_ship"

type LeadtimeValue = number | string | null | undefined

const toDays = (value: LeadtimeValue): number | null => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  const days = Number(value)

  return Number.isInteger(days) && days >= 0 ? days : null
}

/**
 * Days a seller needs before handing an offer to the carrier: the offer's own
 * value, else the seller's default, else the marketplace default.
 */
export const resolveLeadtimeToShip = (
  offerLeadtime: LeadtimeValue,
  sellerDefault: LeadtimeValue,
  marketplaceDefault: LeadtimeValue
): number | null =>
  toDays(offerLeadtime) ?? toDays(sellerDefault) ?? toDays(marketplaceDefault)

export const getMarketplaceDefaultLeadtime = (
  metadata: Record<string, unknown> | null | undefined
): number | null =>
  toDays(metadata?.[MARKETPLACE_DEFAULT_LEADTIME_KEY] as LeadtimeValue)
