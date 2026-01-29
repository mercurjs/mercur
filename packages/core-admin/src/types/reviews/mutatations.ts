export type CreateReviewDTO = {
  order_id: string
  reference: 'product' | 'seller'
  reference_id: string
  rating: number
  customer_note: string | null
  customer_id: string
}

export type UpdateReviewDTO = {
  id: string
  rating?: number
  customer_note?: string
  seller_note?: string
}
