export type OrderGroupDTO = {
  id: string
  customer_id: string | null
  cart_id: string
  seller_count: number
  total: number
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
