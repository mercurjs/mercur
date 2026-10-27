import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ShippingRuleRequirement } from "@mercurjs/types"

export type MissingMandatoryShippingRule = {
  id: string
  shipping_profile_id: string
  shipping_zone: { id: string; name: string }
  shipping_method: { id: string; name: string }
}

type MandatoryRuleRow = MissingMandatoryShippingRule & {
  shipping_zone: MissingMandatoryShippingRule["shipping_zone"] & {
    is_active: boolean
    geo_zones: { country_code: string }[]
  }
  shipping_method: MissingMandatoryShippingRule["shipping_method"] & {
    is_active: boolean
  }
}

const listSellerCountryCodes = async (
  container: MedusaContainer,
  sellerId: string
): Promise<Set<string> | null> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: links } = await query.graph({
    entity: "region_seller",
    filters: { seller_id: sellerId },
    fields: ["region_id"],
  })
  if (!links.length) {
    return null
  }
  const { data: regions } = await query.graph({
    entity: "region",
    filters: {
      id: (links as { region_id: string }[]).map((link) => link.region_id),
    },
    fields: ["countries.iso_2"],
  })
  const countries = (regions as { countries?: { iso_2: string }[] | null }[])
    .flatMap((region) => region.countries ?? [])
    .map((country) => country.iso_2.toLowerCase())
  return countries.length ? new Set(countries) : null
}

/**
 * Mandatory rules a seller has not enabled on any of its stock locations.
 * Only zones that reach one of the seller's region countries count; a seller
 * whose regions name no countries is held to every mandatory rule.
 */
export const listMissingMandatoryShippingRules = async (
  container: MedusaContainer,
  sellerId: string,
  shippingProfileIds?: string[]
): Promise<MissingMandatoryShippingRule[]> => {
  if (shippingProfileIds && !shippingProfileIds.length) {
    return []
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: rules } = await query.graph({
    entity: "shipping_rule",
    fields: [
      "id",
      "shipping_profile_id",
      "shipping_zone.id",
      "shipping_zone.name",
      "shipping_zone.is_active",
      "shipping_zone.geo_zones.country_code",
      "shipping_method.id",
      "shipping_method.name",
      "shipping_method.is_active",
    ],
    filters: {
      requirement: ShippingRuleRequirement.MANDATORY,
      ...(shippingProfileIds
        ? { shipping_profile_id: shippingProfileIds }
        : {}),
    },
  })

  const activeRules = (rules as unknown as MandatoryRuleRow[]).filter(
    (rule) => rule.shipping_zone?.is_active && rule.shipping_method?.is_active
  )
  if (!activeRules.length) {
    return []
  }

  const sellerCountries = await listSellerCountryCodes(container, sellerId)
  const applicable = sellerCountries
    ? activeRules.filter((rule) =>
        rule.shipping_zone.geo_zones.some((geo) =>
          sellerCountries.has(geo.country_code.toLowerCase())
        )
      )
    : activeRules
  if (!applicable.length) {
    return []
  }

  const { data: sellerOptions } = await query.graph({
    entity: "shipping_option_seller",
    fields: ["shipping_option_id"],
    filters: { seller_id: sellerId },
  })
  const sellerOptionIds = (
    sellerOptions as { shipping_option_id: string }[]
  ).map((link) => link.shipping_option_id)

  const enabledRuleIds = new Set<string>()
  if (sellerOptionIds.length) {
    const { data: ruleLinks } = await query.graph({
      entity: "shipping_option_shipping_rule",
      fields: ["shipping_rule_id"],
      filters: {
        shipping_option_id: sellerOptionIds,
        shipping_rule_id: applicable.map((rule) => rule.id),
      },
    })
    for (const link of ruleLinks as { shipping_rule_id: string }[]) {
      enabledRuleIds.add(link.shipping_rule_id)
    }
  }

  return applicable
    .filter((rule) => !enabledRuleIds.has(rule.id))
    .map(({ id, shipping_profile_id, shipping_zone, shipping_method }) => ({
      id,
      shipping_profile_id,
      shipping_zone: { id: shipping_zone.id, name: shipping_zone.name },
      shipping_method: { id: shipping_method.id, name: shipping_method.name },
    }))
}
