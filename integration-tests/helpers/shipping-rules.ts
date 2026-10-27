import { MedusaContainer } from "@medusajs/framework/types"

import { createAdminUser } from "./create-admin-user"

type ApiClient = {
  post: <T>(
    path: string,
    body: Record<string, unknown>,
    headers: unknown
  ) => Promise<{ data: T }>
}

type Requirement = "mandatory" | "optional" | "not_supported"

type Entity = { id: string; [key: string]: unknown }

export type CreateShippingRuleInput = {
  adminHeaders: unknown
  shippingProfileId: string
  countryCodes?: string[]
  requirement?: Requirement
  prices?: { currency_code?: string; region_id?: string; amount: number }[]
  sellerCanEditPrice?: boolean
  transitMinDays?: number | null
  transitMaxDays?: number | null
  sellerCanEditTransit?: boolean
  providerId?: string
}

/**
 * Seeds one operator shipping zone, method and rule through the admin API.
 */
export const createShippingRule = async (
  api: ApiClient,
  input: CreateShippingRuleInput
) => {
  const tag = `${Date.now()}${Math.floor(Math.random() * 1000)}`

  const { shipping_option_type: optionType } = (
    await api.post<{ shipping_option_type: Entity }>(
      "/admin/shipping-option-types",
      { label: `Standard ${tag}`, code: `standard-${tag}`, description: "" },
      input.adminHeaders
    )
  ).data

  const { shipping_zone: zone } = (
    await api.post<{ shipping_zone: Entity }>(
      "/admin/shipping-zones",
      {
        name: `Zone ${tag}`,
        code: `zone-${tag}`,
        geo_zones: (input.countryCodes ?? ["us"]).map((country_code) => ({
          type: "country",
          country_code,
        })),
      },
      input.adminHeaders
    )
  ).data

  const { shipping_method: method } = (
    await api.post<{ shipping_method: Entity }>(
      "/admin/shipping-methods",
      {
        name: `Courier ${tag}`,
        code: `courier-${tag}`,
        provider_id: input.providerId ?? "manual_manual",
        shipping_option_type_id: optionType.id,
      },
      input.adminHeaders
    )
  ).data

  const { shipping_rule: rule } = (
    await api.post<{ shipping_rule: Entity }>(
      "/admin/shipping-rules",
      {
        shipping_zone_id: zone.id,
        shipping_method_id: method.id,
        shipping_profile_id: input.shippingProfileId,
        requirement: input.requirement ?? "optional",
        seller_can_edit_price: input.sellerCanEditPrice ?? false,
        transit_min_days: input.transitMinDays ?? null,
        transit_max_days: input.transitMaxDays ?? null,
        seller_can_edit_transit: input.sellerCanEditTransit ?? false,
        prices: input.prices ?? [{ currency_code: "usd", amount: 500 }],
      },
      input.adminHeaders
    )
  ).data

  return { optionType, zone, method, rule }
}

/**
 * Seeds an operator rule and enables it for a seller's stock location — the
 * only way a seller gets a shipping option.
 */
export const createShippingRuleAndEnable = async (
  api: ApiClient,
  input: CreateShippingRuleInput & {
    sellerHeaders: unknown
    stockLocationId: string
  }
) => {
  const seeded = await createShippingRule(api, input)

  const { shipping_option: shippingOption } = (
    await api.post<{ shipping_option: Entity }>(
      `/vendor/shipping-rules/${seeded.rule.id}/enable`,
      { stock_location_id: input.stockLocationId },
      input.sellerHeaders
    )
  ).data

  return { ...seeded, shippingOption }
}

let scopedAdminCounter = 0

/**
 * Shipping setup is operator-owned, so specs that only have a seller still
 * need an admin token. A uniquely-emailed admin keeps this from colliding
 * with a spec's own `createAdminUser` call or mutating the shared headers.
 */
export const createScopedAdminHeaders = async (container: MedusaContainer) => {
  const headers: { headers: Record<string, string> } = { headers: {} }
  await createAdminUser(null, headers, container, {
    email: `shipping-admin-${Date.now()}-${++scopedAdminCounter}@test.com`,
  })
  return headers
}
