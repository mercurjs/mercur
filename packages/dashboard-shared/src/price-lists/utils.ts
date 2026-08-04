import { HttpTypes } from "@mercurjs/types"
import i18n, { TFunction } from "i18next"
import { PriceListDateStatus, PriceListStatus } from "./constants"

// Local copy of the dashboards' `castNumber` helper so the shared price-list
// utilities have no dependency on either package's `lib/`.
const castNumber = (number: number | string) =>
  typeof number === "string" ? Number(number.replace(",", ".")) : number

const getValues = (priceList: HttpTypes.AdminPriceList) => {
  const startsAt = priceList.starts_at
  const endsAt = priceList.ends_at

  const isExpired = endsAt ? new Date(endsAt) < new Date() : false
  const isScheduled = startsAt ? new Date(startsAt) > new Date() : false
  const isDraft = priceList.status === PriceListStatus.DRAFT

  return {
    isExpired,
    isScheduled,
    isDraft,
  }
}

export const getPriceListStatus = (
  t: TFunction<"translation">,
  priceList: HttpTypes.AdminPriceList
) => {
  const { isExpired, isScheduled, isDraft } = getValues(priceList)

  let text = t("priceLists.fields.status.options.active")
  let color: "red" | "grey" | "orange" | "green" = "green"
  let status: string = PriceListStatus.ACTIVE

  if (isDraft) {
    color = "grey"
    text = t("priceLists.fields.status.options.draft")
    status = PriceListStatus.DRAFT
  }

  if (isExpired) {
    color = "red"
    text = t("priceLists.fields.status.options.expired")
    status = PriceListDateStatus.EXPIRED
  }

  if (isScheduled) {
    color = "orange"
    text = t("priceLists.fields.status.options.scheduled")
    status = PriceListDateStatus.SCHEDULED
  }

  return {
    color,
    text,
    status,
  }
}

export const isProductRow = (
  row: HttpTypes.AdminProduct | HttpTypes.AdminProductVariant
): row is HttpTypes.AdminProduct => {
  return "variants" in row
}

type OfferCurrencyPrice = { amount?: string | number }

// Structural shape of the offer-keyed grid state. Typed here (rather than
// importing each package's zod-inferred type) so this shared helper stays
// decoupled from either dashboard's zod instance.
export type ExtractableOffer = {
  variant_id: string
  currency_prices?: Record<string, OfferCurrencyPrice | undefined>
  region_prices?: Record<string, OfferCurrencyPrice | undefined>
}

export type ExtractableOffers = Record<string, ExtractableOffer>

/**
 * Build the API price payload from the offer-keyed grid state. Each price
 * carries its `offer_id` rule so the override is scoped to that seller's offer
 * and never leaks onto another seller's offer of the same variant.
 */
export const extractPricesFromOffers = (
  offers: ExtractableOffers,
  regions: HttpTypes.AdminRegion[]
) => {
  return Object.entries(offers).flatMap(([offerId, offer]) => {
    const extractPriceDetails = (
      price: OfferCurrencyPrice,
      priceType: "region" | "currency",
      id: string
    ) => {
      const currencyCode =
        priceType === "currency"
          ? id
          : regions.find((r) => r.id === id)?.currency_code

      if (!currencyCode) {
        throw new Response(
          JSON.stringify({
            message: i18n.t("validation.currencyCodeNotFound"),
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }

      return {
        amount: castNumber(price.amount!),
        rules: {
          offer_id: offerId,
          ...(priceType === "region" ? { region_id: id } : {}),
        },
        currency_code: currencyCode,
        variant_id: offer.variant_id,
      }
    }

    const currencyPrices = Object.entries(offer.currency_prices || {}).flatMap(
      ([currencyCode, currencyPrice]) =>
        currencyPrice?.amount
          ? [extractPriceDetails(currencyPrice, "currency", currencyCode)]
          : []
    )

    const regionPrices = Object.entries(offer.region_prices || {}).flatMap(
      ([regionId, regionPrice]) =>
        regionPrice?.amount
          ? [extractPriceDetails(regionPrice, "region", regionId)]
          : []
    )

    return [...currencyPrices, ...regionPrices]
  })
}
