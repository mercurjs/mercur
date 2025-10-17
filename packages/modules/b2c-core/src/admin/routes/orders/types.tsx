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
}

export interface OrderResponse {
  order: Order
}

export interface OrderListResponse {
  orders: Order[]
  count?: number
}

export interface OrderQueryParams {
  limit?: number
  offset?: number
  fields?: string
  expand?: string
  order?: string
  created_at?: string
  updated_at?: string
  status?: string[]
  region_id?: string[]
  sales_channel_id?: string[]
  q?: string
}
