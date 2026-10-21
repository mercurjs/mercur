export type OrderGroupDTO = {
  id: string
  display_id: number
  customer_id: string | null
  cart_id: string
  metadata: Record<string, unknown> | null
  seller_count: number
  total: number
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
