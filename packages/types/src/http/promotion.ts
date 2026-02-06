import { DeleteResponse, PaginatedResponse, PromotionDTO, PromotionRuleDTO } from "@medusajs/types"

export type VendorPromotion = PromotionDTO

export type VendorPromotionRule = PromotionRuleDTO

export type VendorPromotionResponse = {
  promotion: VendorPromotion
}

export type VendorPromotionListResponse = PaginatedResponse<{
  promotions: VendorPromotion[]
}>

export type VendorPromotionDeleteResponse = DeleteResponse<"promotion">

export type VendorPromotionRuleListResponse = {
  rules: VendorPromotionRule[]
}

export type VendorPromotionRuleBatchResponse = {
  created: VendorPromotionRule[]
  updated: VendorPromotionRule[]
  deleted: {
    ids: string[]
    object: "promotion-rule"
    deleted: true
  }
}

export type VendorRuleAttributeOption = {
  id: string
  value: string
  label: string
  required: boolean
  field_type: string
  operators: {
    id: string
    value: string
    label: string
  }[]
}

export type VendorRuleAttributeOptionsListResponse = {
  attributes: VendorRuleAttributeOption[]
}

export type VendorRuleValueOption = {
  label: string
  value: string
}

export type VendorRuleValueOptionsListResponse = PaginatedResponse<{
  values: VendorRuleValueOption[]
}>
