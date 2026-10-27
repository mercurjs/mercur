import {
  computeExpectedDelivery,
  ExpectedDelivery,
  getMarketplaceDefaultLeadtime,
  resolveLeadtimeToShip,
  resolveTransitDays,
} from "@mercurjs/types"

export type DeliveryShippingOption = {
  id: string
  metadata?: Record<string, unknown> | null
  seller?: { id: string } | null
  shipping_rule?: {
    transit_min_days: number | null
    transit_max_days: number | null
  } | null
}

export type DeliveryOffer = {
  id: string
  seller_id: string
  leadtime_to_ship: number | null
}

export type DeliverySellerDefaults = {
  id: string
  default_leadtime_to_ship: number | null
  closed_from: string | Date | null
  closed_to: string | Date | null
}

/**
 * Expected delivery per shipping option, using the longest lead time among
 * the seller's offers in the order. Options with no transit time are left out.
 */
export const buildExpectedDeliveryByShippingOption = ({
  start,
  shippingOptions,
  offers,
  sellers,
  marketplaceMetadata,
}: {
  start: Date
  shippingOptions: DeliveryShippingOption[]
  offers: DeliveryOffer[]
  sellers: DeliverySellerDefaults[]
  marketplaceMetadata: Record<string, unknown> | null | undefined
}): Record<string, ExpectedDelivery> => {
  const marketplaceLeadtime = getMarketplaceDefaultLeadtime(marketplaceMetadata)
  const sellerById = new Map(sellers.map((seller) => [seller.id, seller]))

  const leadtimeBySeller = new Map<string, number | null>()
  for (const offer of offers) {
    const leadtime = resolveLeadtimeToShip(
      offer.leadtime_to_ship,
      sellerById.get(offer.seller_id)?.default_leadtime_to_ship,
      marketplaceLeadtime
    )
    const current = leadtimeBySeller.get(offer.seller_id)
    leadtimeBySeller.set(
      offer.seller_id,
      leadtime === null ? (current ?? null) : Math.max(current ?? 0, leadtime)
    )
  }

  const result: Record<string, ExpectedDelivery> = {}
  for (const option of shippingOptions) {
    const sellerId = option.seller?.id
    const transit = resolveTransitDays(option.metadata, option.shipping_rule)
    if (!sellerId || (transit.min === null && transit.max === null)) {
      continue
    }
    result[option.id] = computeExpectedDelivery({
      start,
      leadtimeDays:
        leadtimeBySeller.get(sellerId) ??
        resolveLeadtimeToShip(
          null,
          sellerById.get(sellerId)?.default_leadtime_to_ship,
          marketplaceLeadtime
        ),
      transitMinDays: transit.min,
      transitMaxDays: transit.max,
      closure: sellerById.get(sellerId),
    })
  }
  return result
}

const maxDay = (a: string | null, b: string | null) =>
  a === null ? b : b === null ? a : a > b ? a : b

export const latestExpectedDelivery = (
  deliveries: ExpectedDelivery[]
): ExpectedDelivery =>
  deliveries.reduce((acc, delivery) => ({
    shipping_deadline:
      maxDay(acc.shipping_deadline, delivery.shipping_deadline) ??
      acc.shipping_deadline,
    earliest: maxDay(acc.earliest, delivery.earliest),
    latest: maxDay(acc.latest, delivery.latest),
  }))
