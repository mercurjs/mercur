import { HttpTypes } from "@mercurjs/types"
import { TFunction } from "i18next"

import { getLocaleAmount } from "@lib/money-amount-helpers"

export type VendorShippingRule = HttpTypes.VendorShippingRuleDTO

export type ShippingOptionPriceRule = {
  attribute: string
  operator?: string
  value: string
}

export type ShippingOptionPrice = {
  id: string
  currency_code: string | null
  amount: number
  price_rules?: ShippingOptionPriceRule[] | null
}

export type VendorShippingOptionWithPrices = {
  id: string
  name: string
  price_type: string
  metadata: Record<string, unknown> | null
  shipping_profile_id?: string | null
  shipping_profile?: { id: string; name: string } | null
  prices?: ShippingOptionPrice[] | null
}

export type RegionLite = {
  id: string
  name: string
  currency_code: string
}

export type ShippingPriceRow = {
  key: string
  currency_code: string
  region_id?: string
  label: string
  price_id?: string
  amount: number | null
}

export const TRANSIT_MIN_KEY = "transit_min_days"
export const TRANSIT_MAX_KEY = "transit_max_days"

export const getProfileDisplayName = (name?: string | null) => {
  if (!name) {
    return null
  }

  return name.includes(":") ? name.split(":").slice(1).join(":") : name
}

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

export const getEffectiveTransit = (
  rule: Pick<VendorShippingRule, "transit_min_days" | "transit_max_days">,
  metadata?: Record<string, unknown> | null
) => {
  const minOverride = toNumberOrNull(metadata?.[TRANSIT_MIN_KEY])
  const maxOverride = toNumberOrNull(metadata?.[TRANSIT_MAX_KEY])

  return {
    min: minOverride ?? rule.transit_min_days,
    max: maxOverride ?? rule.transit_max_days,
  }
}

export const formatTransit = (
  t: TFunction,
  transit: { min: number | null; max: number | null }
) => {
  const { min, max } = transit

  if (min !== null && max !== null) {
    return t("shippingMethods.transit.range", { min, max })
  }

  if (min !== null) {
    return t("shippingMethods.transit.min", { min })
  }

  if (max !== null) {
    return t("shippingMethods.transit.max", { max })
  }

  return null
}

const formatAmounts = (
  prices: { currency_code: string | null; amount: number }[]
) =>
  Array.from(
    new Set(
      prices
        .filter((price) => !!price.currency_code)
        .map((price) =>
          getLocaleAmount(Number(price.amount), price.currency_code!)
        )
    )
  ).join(", ")

export const formatRulePrice = (
  t: TFunction,
  rule: VendorShippingRule,
  regions: RegionLite[]
) => {
  if (rule.price_type === "calculated") {
    return t("shippingMethods.price.calculated")
  }

  const enabledOption = rule.seller_shipping_options[0]
  const prices = enabledOption
    ? enabledOption.prices
    : rule.prices.map((price) => ({
        currency_code:
          price.currency_code ??
          regions.find((region) => region.id === price.region_id)
            ?.currency_code ??
          null,
        amount: price.amount,
      }))

  return formatAmounts(prices) || t("shippingMethods.price.none")
}

export const formatOptionPrice = (
  t: TFunction,
  option: VendorShippingOptionWithPrices
) => {
  if (option.price_type === "calculated") {
    return t("shippingMethods.price.calculated")
  }

  return formatAmounts(option.prices ?? []) || t("shippingMethods.price.none")
}

const getRegionRuleValue = (price: ShippingOptionPrice) =>
  price.price_rules?.find((rule) => rule.attribute === "region_id")?.value

const isConditionalPrice = (price: ShippingOptionPrice) =>
  !!price.price_rules?.some((rule) => rule.attribute !== "region_id")

const findOptionPrice = (
  prices: ShippingOptionPrice[],
  row: { currency_code: string; region_id?: string }
) =>
  prices.find((price) => {
    if (isConditionalPrice(price)) {
      return false
    }

    const regionId = getRegionRuleValue(price)

    if (row.region_id) {
      return regionId === row.region_id
    }

    return !regionId && price.currency_code === row.currency_code
  })

const getRegionLabel = (regionId: string, regions: RegionLite[]) => {
  const region = regions.find((r) => r.id === regionId)

  return region
    ? `${region.name} (${region.currency_code.toUpperCase()})`
    : regionId
}

export const buildRulePriceRows = (
  rule: VendorShippingRule,
  regions: RegionLite[],
  option?: VendorShippingOptionWithPrices
): ShippingPriceRow[] =>
  rule.prices.map((price) => {
    const region = price.region_id
      ? regions.find((r) => r.id === price.region_id)
      : undefined
    const currencyCode = price.currency_code ?? region?.currency_code ?? ""
    const row = {
      currency_code: currencyCode,
      region_id: price.region_id ?? undefined,
    }
    const existing = option
      ? findOptionPrice(option.prices ?? [], row)
      : undefined

    return {
      ...row,
      key: price.id,
      label: price.region_id
        ? getRegionLabel(price.region_id, regions)
        : currencyCode.toUpperCase(),
      price_id: existing?.id,
      amount: existing ? Number(existing.amount) : Number(price.amount),
    }
  })

export const buildOptionPriceRows = (
  option: VendorShippingOptionWithPrices,
  regions: RegionLite[]
): ShippingPriceRow[] =>
  (option.prices ?? [])
    .filter((price) => !isConditionalPrice(price) && !!price.currency_code)
    .map((price) => {
      const regionId = getRegionRuleValue(price)

      return {
        key: price.id,
        currency_code: price.currency_code!,
        region_id: regionId,
        label: regionId
          ? getRegionLabel(regionId, regions)
          : price.currency_code!.toUpperCase(),
        price_id: price.id,
        amount: Number(price.amount),
      }
    })

export type ShippingOptionPriceUpdate =
  | { id: string; amount?: number }
  | { currency_code: string; amount: number }
  | { region_id: string; amount: number }

export const buildOptionPriceUpdate = (
  rows: ShippingPriceRow[],
  amounts: Record<string, number>,
  option: VendorShippingOptionWithPrices
): ShippingOptionPriceUpdate[] => {
  const touched = new Set<string>()

  const updates: ShippingOptionPriceUpdate[] = rows.map((row) => {
    const amount = amounts[row.key]

    if (row.price_id) {
      touched.add(row.price_id)
      return { id: row.price_id, amount }
    }

    return row.region_id
      ? { region_id: row.region_id, amount }
      : { currency_code: row.currency_code, amount }
  })

  const untouched = (option.prices ?? [])
    .filter((price) => isConditionalPrice(price) && !touched.has(price.id))
    .map((price) => ({ id: price.id }))

  return [...updates, ...untouched]
}
