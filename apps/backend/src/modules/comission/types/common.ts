import { BigNumberValue } from '@medusajs/framework/types'

export type ComissionRateDTO = {
  id: string
  created_at: Date
  updated_at: Date
  type: string
  percentage_rate: number
  is_default: boolean
  include_tax: boolean
  include_shipping: boolean
  price_set_id: string
  max_price_set_id: string
  min_price_set_id: string
}

export type ComissionRuleDTO = {
  id: string
  created_at: Date
  updated_at: Date
  name: string
  reference: string
  reference_id: string
  rate: ComissionRateDTO
}

export type ComissionLineDTO = {
  id: string
  item_line_id: string
  rule_id: string
  currency_code: string
  value: BigNumberValue
  created_at: Date
  updated_at: Date
}

export type ComissionCalculationContext = {
  product_type_id: string
  product_category_id: string
  seller_id: string
}
