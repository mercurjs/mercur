import {
  DeleteResponse,
  PaginatedResponse,
  ShippingOptionDTO,
  ShippingOptionRuleDTO,
} from "@medusajs/types"

export interface VendorShippingOptionResponse {
  /**
   * The shipping option's details.
   */
  shipping_option: ShippingOptionDTO
}

export type VendorShippingOptionListResponse = PaginatedResponse<{
  /**
   * The list of shipping options.
   */
  shipping_options: ShippingOptionDTO[]
}>

export type VendorShippingOptionDeleteResponse = DeleteResponse<"shipping_option">

export interface VendorUpdateShippingOptionRulesResponse {
  /**
   * The created shipping option rules.
   */
  created: ShippingOptionRuleDTO[]
  /**
   * The updated shipping option rules.
   */
  updated: ShippingOptionRuleDTO[]
  /**
   * The deleted shipping option rules.
   */
  deleted: {
    ids: string[]
    object: "shipping_option_rule"
    deleted: boolean
  }
}
