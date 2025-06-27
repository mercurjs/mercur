export type ReviewDTO = {
  id: string
  reference: 'product' | 'seller'
  rating: number
  customer_note: string | null
  customer_id: string
  seller_note: string | null
  created_at: Date
  updated_at: Date | null
}
