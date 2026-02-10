import { CurrencyInfo } from "../../../lib/data/currencies"

export type ConditionalShippingOptionPriceAccessor =
  | `conditional_region_prices.${string}`
  | `conditional_currency_prices.${string}`

export type ConditionalPriceInfo = {
  type: "currency" | "region"
  field: string
  name: string
  currency: CurrencyInfo
}
