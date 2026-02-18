import { ReviewReference } from "./common"

export interface CreateReviewDTO {
  reference: ReviewReference
  reference_id: string
  rating: number
  customer_note?: string | null
  customer_id: string
  order_id: string
}

export interface UpdateReviewDTO {
  id: string
  rating?: number
  customer_note?: string | null
  seller_note?: string | null
}
