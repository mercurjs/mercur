import { HttpTypes } from "@medusajs/types"
import i18n, { TFunction } from "i18next"
import { castNumber } from "../../../lib/cast-number"
import { PriceListDateStatus, PriceListStatus } from "./constants"
import {
  PriceListCreateCurrencyPrice,
  PriceListCreateOffersSchema,
} from "./schemas"

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

// Build the API price payload from the offer-keyed grid state. Each price
// carries its offer_id rule so the override is scoped to that seller's offer.
export const extractPricesFromOffers = (
  offers: PriceListCreateOffersSchema,
  regions: HttpTypes.AdminRegion[]
) => {
  return Object.entries(offers).flatMap(([offerId, offer]) => {
    const extractPriceDetails = (
      price: PriceListCreateCurrencyPrice,
      priceType: "region" | "currency",
      id: string
    ) => {
      const currencyCode =
        priceType === "currency"
          ? id
          : regions.find((r) => r.id === id)?.currency_code

      if (!currencyCode) {
        throw new Response(
          JSON.stringify({ message: i18n.t("validation.currencyCodeNotFound") }),
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
