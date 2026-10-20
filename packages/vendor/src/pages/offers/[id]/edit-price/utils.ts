import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"

import { castNumber } from "../../../../lib/cast-number"
import { isBasePrice, isRegionPrice } from "../../common/region-prices"
import { OfferPrice } from "../../common/types"

export type EditPriceRow = {
  offer_id: string
  variant_title: string
  product_thumbnail?: string | null
  prices: Record<string, number | string>
  region_prices: Record<string, number | string>
}

export type Region = HttpTypes.AdminRegion

type RegionPrice = Pick<Region, "id" | "currency_code">

export type PriceProduct = HttpTypes.AdminProduct & {
  variants?: Array<
    HttpTypes.AdminProductVariant & { offers?: OfferDTO[] | null }
  > | null
}

export type OfferPricePayload = {
  amount: number
  currency_code: string
  rules?: Record<string, string>
}

const isEmpty = (v: number | string | undefined | null): v is "" | null | undefined =>
  v === "" || v === null || v === undefined

const numericOrZero = (v: number | string): number => castNumber(v) || 0

export const buildRows = (
  product: PriceProduct,
  currencies: string[],
  regions: RegionPrice[],
): EditPriceRow[] =>
  (product.variants ?? []).flatMap((variant) =>
    (variant.offers ?? []).map((offer) => {
      const offerPrices = (offer.prices ?? []) as OfferPrice[]
      const prices: Record<string, number | ""> = {}
      for (const code of currencies) {
        const match = offerPrices.find(
          (p) => isBasePrice(p) && p.currency_code === code,
        )
        prices[code] = match?.amount ?? ""
      }
      const region_prices: Record<string, number | ""> = {}
      for (const region of regions) {
        const match = offerPrices.find((p) => isRegionPrice(p, region.id))
        region_prices[region.id] = match?.amount ?? ""
      }
      return {
        offer_id: offer.id,
        variant_title: variant.title ?? "",
        product_thumbnail: product.thumbnail ?? null,
        prices,
        region_prices,
      }
    }),
  )

export const buildPricePayload = (
  row: EditPriceRow,
  currencies: string[],
  regions: RegionPrice[],
): OfferPricePayload[] => {
  const prices: OfferPricePayload[] = []
  for (const code of currencies) {
    const value = row.prices?.[code]
    if (isEmpty(value)) continue
    prices.push({ amount: numericOrZero(value), currency_code: code })
  }
  for (const region of regions) {
    const value = row.region_prices?.[region.id]
    if (isEmpty(value)) continue
    prices.push({
      amount: numericOrZero(value),
      currency_code: region.currency_code,
      rules: { region_id: region.id },
    })
  }
  return prices
}
