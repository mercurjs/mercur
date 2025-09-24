export interface Seller {
  id: string
  name: string
}

export interface Order {
  id: string
  display_id: number
  region_id: string
  customer_id: string
  version: number
  sales_channel_id: string
  status: string
  is_draft_order: boolean
  email: string
  currency_code: string
  no_notification: boolean
  metadata: null
  canceled_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  shipping_address_id: string
  billing_address_id: string
  items: { id: string }[]
  seller: Seller
}

export interface Rate {
  id: string
  type: string
  percentage_rate: number
  include_tax: boolean
}

export interface Rule {
  id: string
  name: string
  reference: string
  reference_id: string
  is_active: boolean
  rate: Rate
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CommissionLine {
  id: string
  item_line_id: string
  rule_id: string
  currency_code: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  value: number
  order: Order
  rule: Rule
}
