export enum ShippingRuleRequirement {
  MANDATORY = "mandatory",
  OPTIONAL = "optional",
  NOT_SUPPORTED = "not_supported",
}

export type ShippingRulePriceType = "flat" | "calculated"

export type ShippingZoneGeoType = "country" | "province"

export interface ShippingZoneGeoDTO {
  id: string
  type: ShippingZoneGeoType
  country_code: string
  province_code: string | null
}

export interface ShippingZoneDTO {
  id: string
  name: string
  code: string
  is_active: boolean
  geo_zones: ShippingZoneGeoDTO[]
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface MarketplaceShippingMethodDTO {
  id: string
  name: string
  code: string
  description: string | null
  provider_id: string
  shipping_option_type_id: string
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface ShippingRulePriceDTO {
  id: string
  currency_code: string | null
  region_id: string | null
  amount: number
}

export interface ShippingRuleDTO {
  id: string
  shipping_zone_id: string
  shipping_method_id: string
  shipping_profile_id: string
  requirement: ShippingRuleRequirement
  price_type: ShippingRulePriceType
  seller_can_edit_price: boolean
  transit_min_days: number | null
  transit_max_days: number | null
  seller_can_edit_transit: boolean
  prices: ShippingRulePriceDTO[]
  shipping_zone?: ShippingZoneDTO
  shipping_method?: MarketplaceShippingMethodDTO
  created_at: Date
  updated_at: Date
}

export interface CreateShippingZoneGeoDTO {
  type: ShippingZoneGeoType
  country_code: string
  province_code?: string | null
}

export interface CreateShippingZoneDTO {
  name: string
  code: string
  is_active?: boolean
  geo_zones: CreateShippingZoneGeoDTO[]
  metadata?: Record<string, unknown> | null
}

export interface UpdateShippingZoneDTO {
  id: string
  name?: string
  is_active?: boolean
  geo_zones?: CreateShippingZoneGeoDTO[]
  metadata?: Record<string, unknown> | null
}

export interface CreateMarketplaceShippingMethodDTO {
  name: string
  code: string
  description?: string | null
  provider_id: string
  shipping_option_type_id: string
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateMarketplaceShippingMethodDTO {
  id: string
  name?: string
  description?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface ShippingRulePriceInput {
  currency_code?: string
  region_id?: string
  amount: number
}

export interface CreateShippingRuleDTO {
  shipping_zone_id: string
  shipping_method_id: string
  shipping_profile_id: string
  requirement: ShippingRuleRequirement
  price_type?: ShippingRulePriceType
  seller_can_edit_price?: boolean
  transit_min_days?: number | null
  transit_max_days?: number | null
  seller_can_edit_transit?: boolean
  prices?: ShippingRulePriceInput[]
}

export interface UpdateShippingRuleDTO {
  id: string
  requirement?: ShippingRuleRequirement
  price_type?: ShippingRulePriceType
  seller_can_edit_price?: boolean
  transit_min_days?: number | null
  transit_max_days?: number | null
  seller_can_edit_transit?: boolean
  prices?: ShippingRulePriceInput[]
}
