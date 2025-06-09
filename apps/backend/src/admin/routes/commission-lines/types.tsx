export interface RawValue {
  value: string
  precision: number
}

export interface Address {
  id: string
}

export interface OrderItem {
  id: string
}

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
  shipping_address: Address
  billing_address: Address
  created_at: string
  updated_at: string
  deleted_at: string | null
  shipping_address_id: string
  billing_address_id: string
  items: OrderItem[]
  seller: Seller
}

export interface CommissionLine {
  id: string
  item_line_id: string
  rule_id: string
  currency_code: string
  raw_value: RawValue
  created_at: string
  updated_at: string
  deleted_at: string | null
  value: number
  order: Order
}
