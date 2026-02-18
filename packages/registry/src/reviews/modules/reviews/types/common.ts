export type ReviewReference = "product" | "seller"

export interface ReviewDTO {
  id: string
  reference: ReviewReference
  rating: number
  customer_note: string | null
  seller_note: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export const ReviewEvents = {
  REVIEW_CHANGED: "review.changed",
} as const
