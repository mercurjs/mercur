import { ReviewReference, ReviewStatus } from "./common"

export interface CreateReviewDTO {
  order_id: string
  reference: ReviewReference
  reference_id: string
  rating: number
  customer_note?: string | null
  customer_id: string
}

export interface UpdateReviewDTO {
  id: string
  rating?: number
  customer_note?: string | null
  seller_note?: string | null
  status?: ReviewStatus
}

export interface RespondReviewDTO {
  id: string
  seller_note: string
}
