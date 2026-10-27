import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import {
  MarketplaceShippingMethodDTO,
  ShippingRuleDTO,
  ShippingZoneDTO,
} from "../shipping-rule"

export interface AdminShippingZoneResponse {
  shipping_zone: ShippingZoneDTO
}

export type AdminShippingZoneListResponse = PaginatedResponse<{
  shipping_zones: ShippingZoneDTO[]
}>

export type AdminShippingZoneDeleteResponse = DeleteResponse<"shipping_zone">

export interface AdminShippingMethodResponse {
  shipping_method: MarketplaceShippingMethodDTO
}

export type AdminShippingMethodListResponse = PaginatedResponse<{
  shipping_methods: MarketplaceShippingMethodDTO[]
}>

export type AdminShippingMethodDeleteResponse =
  DeleteResponse<"shipping_method">

export interface AdminShippingRuleResponse {
  shipping_rule: ShippingRuleDTO
}

export type AdminShippingRuleListResponse = PaginatedResponse<{
  shipping_rules: ShippingRuleDTO[]
}>

export type AdminShippingRuleDeleteResponse = DeleteResponse<"shipping_rule">

export interface AdminShippingRulesBatchResponse {
  created: ShippingRuleDTO[]
  updated: ShippingRuleDTO[]
  deleted: {
    ids: string[]
    object: "shipping_rule"
    deleted: boolean
  }
}

export interface VendorSellerShippingRuleOption {
  id: string
  stock_location_id: string | null
  prices: { currency_code: string | null; amount: number }[]
  metadata: Record<string, unknown> | null
}

export type VendorShippingRuleDTO = ShippingRuleDTO & {
  seller_shipping_options: VendorSellerShippingRuleOption[]
}

export type VendorShippingRuleListResponse = PaginatedResponse<{
  shipping_rules: VendorShippingRuleDTO[]
}>
