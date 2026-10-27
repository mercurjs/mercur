import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  HttpTypes,
  ShippingRuleDTO,
  ShippingRuleRequirement,
} from "@mercurjs/types"

import { listMissingMandatoryShippingRules } from "../../../workflows/shipping-rule"

export const VENDOR_SHIPPING_RULE_FIELDS = [
  "id",
  "shipping_zone_id",
  "shipping_method_id",
  "shipping_profile_id",
  "requirement",
  "price_type",
  "seller_can_edit_price",
  "transit_min_days",
  "transit_max_days",
  "seller_can_edit_transit",
  "created_at",
  "updated_at",
  "prices.id",
  "prices.currency_code",
  "prices.region_id",
  "prices.amount",
  "shipping_zone.id",
  "shipping_zone.name",
  "shipping_zone.code",
  "shipping_zone.is_active",
  "shipping_zone.geo_zones.type",
  "shipping_zone.geo_zones.country_code",
  "shipping_zone.geo_zones.province_code",
  "shipping_method.id",
  "shipping_method.name",
  "shipping_method.code",
  "shipping_method.description",
  "shipping_method.is_active",
  "shipping_method.provider_id",
]

type SellerOptionRow = {
  id: string
  metadata: Record<string, unknown> | null
  prices?: { currency_code: string | null; amount: number }[] | null
  shipping_rule?: { id: string } | null
  service_zone?: {
    fulfillment_set?: { location?: { id: string } | null } | null
  } | null
}

type RuleRow = ShippingRuleDTO & {
  shipping_zone: NonNullable<ShippingRuleDTO["shipping_zone"]>
  shipping_method: NonNullable<ShippingRuleDTO["shipping_method"]>
}

export const listVendorShippingRules = async (
  scope: MedusaContainer,
  sellerId: string,
  filters: {
    shipping_zone_id?: string | string[]
    shipping_profile_id?: string | string[]
    stock_location_id?: string
    missing_mandatory?: boolean
  }
): Promise<HttpTypes.VendorShippingRuleDTO[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: rules } = await query.graph({
    entity: "shipping_rule",
    fields: VENDOR_SHIPPING_RULE_FIELDS,
    filters: {
      requirement: [
        ShippingRuleRequirement.MANDATORY,
        ShippingRuleRequirement.OPTIONAL,
      ],
      ...(filters.shipping_zone_id
        ? { shipping_zone_id: filters.shipping_zone_id }
        : {}),
      ...(filters.shipping_profile_id
        ? { shipping_profile_id: filters.shipping_profile_id }
        : {}),
    },
  })

  let available = (rules as unknown as RuleRow[]).filter(
    (rule) => rule.shipping_zone?.is_active && rule.shipping_method?.is_active
  )

  if (filters.missing_mandatory) {
    const missing = new Set(
      (await listMissingMandatoryShippingRules(scope, sellerId)).map(
        (rule) => rule.id
      )
    )
    available = available.filter((rule) => missing.has(rule.id))
  }

  const { data: sellerLinks } = await query.graph({
    entity: "shipping_option_seller",
    fields: ["shipping_option_id"],
    filters: { seller_id: sellerId },
  })
  const sellerOptionIds = (
    sellerLinks as { shipping_option_id: string }[]
  ).map((link) => link.shipping_option_id)

  const { data: options } = sellerOptionIds.length
    ? await query.graph({
        entity: "shipping_option",
        fields: [
          "id",
          "metadata",
          "prices.currency_code",
          "prices.amount",
          "shipping_rule.id",
          "service_zone.fulfillment_set.location.id",
        ],
        filters: { id: sellerOptionIds },
      })
    : { data: [] }

  const optionsByRule = new Map<
    string,
    HttpTypes.VendorSellerShippingRuleOption[]
  >()
  for (const option of options as unknown as SellerOptionRow[]) {
    const ruleId = option.shipping_rule?.id
    if (!ruleId) {
      continue
    }
    const locationId =
      option.service_zone?.fulfillment_set?.location?.id ?? null
    if (filters.stock_location_id && locationId !== filters.stock_location_id) {
      continue
    }
    const list = optionsByRule.get(ruleId) ?? []
    list.push({
      id: option.id,
      stock_location_id: locationId,
      prices: (option.prices ?? []).map((price) => ({
        currency_code: price.currency_code,
        amount: Number(price.amount),
      })),
      metadata: option.metadata,
    })
    optionsByRule.set(ruleId, list)
  }

  return available.map((rule) => ({
    ...rule,
    seller_shipping_options: optionsByRule.get(rule.id) ?? [],
  }))
}
