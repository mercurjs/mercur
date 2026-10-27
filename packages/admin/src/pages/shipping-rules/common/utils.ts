import type { ShippingRuleDTO } from "@mercurjs/types"
import type { TFunction } from "i18next"

import { getLocaleAmount } from "../../../lib/money-amount-helpers"

export const SHIPPING_RULES_PATH = "/settings/locations/shipping-rules"

export const getShippingRulesPath = (zoneId?: string) =>
  zoneId ? `${SHIPPING_RULES_PATH}?zone=${zoneId}` : SHIPPING_RULES_PATH

export const getConfigurePath = (
  zoneId: string,
  methodId: string,
  profileId: string
) => {
  const params = new URLSearchParams({
    zone: zoneId,
    method: methodId,
    profile: profileId,
  })

  return `${SHIPPING_RULES_PATH}/configure?${params.toString()}`
}

export const formatRulePrices = (rule: Pick<ShippingRuleDTO, "prices">) =>
  rule.prices
    .filter((price) => !!price.currency_code)
    .map((price) => getLocaleAmount(price.amount, price.currency_code!))

export const formatTransit = (
  rule: Pick<ShippingRuleDTO, "transit_min_days" | "transit_max_days">,
  t: TFunction
) => {
  const min = rule.transit_min_days
  const max = rule.transit_max_days

  if (min !== null && max !== null) {
    return t("shippingRules.transit.range", { min, max })
  }

  if (min !== null) {
    return t("shippingRules.transit.min", { min })
  }

  if (max !== null) {
    return t("shippingRules.transit.max", { max })
  }

  return undefined
}
