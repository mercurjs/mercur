import { ConditionalShippingOptionPriceAccessor } from "../types"

export const getCustomShippingOptionPriceFieldName = (
  field: string,
  type: "region" | "currency"
): ConditionalShippingOptionPriceAccessor => {
  const prefix = type === "region" ? "region_prices" : "currency_prices"
  const customPrefix =
    type === "region"
      ? "conditional_region_prices"
      : "conditional_currency_prices"

  const name = field.replace(
    prefix,
    customPrefix
  ) as ConditionalShippingOptionPriceAccessor

  return name
}
