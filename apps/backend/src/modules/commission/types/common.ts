import { BigNumberValue } from '@medusajs/framework/types'

export type CommissionRateDTO = {
  id: string
  created_at: Date
  updated_at: Date
  type: string
  percentage_rate: number
  include_tax: boolean
  price_set_id: string
  max_price_set_id: string
  min_price_set_id: string
}

export type CommissionRuleDTO = {
  id: string
  created_at: Date
  updated_at: Date
  name: string
  reference: string
  reference_id: string
  rate: CommissionRateDTO
}

export type CommissionLineDTO = {
  id: string
  item_line_id: string
  rule_id: string
  currency_code: string
  value: BigNumberValue
  created_at: Date
  updated_at: Date
}

export type CommissionCalculationContext = {
  product_type_id: string
  product_category_id: string
  seller_id: string
}
