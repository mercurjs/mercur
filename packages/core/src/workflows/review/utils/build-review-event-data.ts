import { ReviewReference } from "@mercurjs/types"

export type LinkedReview = {
  id: string
  reference: ReviewReference
  product?: { id: string } | null
  seller?: { id: string } | null
}

export type ReviewEventData = {
  id: string
  reference: ReviewReference
  reference_id?: string
}

/**
 * The reviewed product/seller sits on a link rather than on the review row, so
 * event consumers get it resolved here from a graph read of both relations.
 */
export const buildReviewEventData = (review: LinkedReview): ReviewEventData => {
  const target =
    review.reference === "product" ? review.product : review.seller

  return {
    id: review.id,
    reference: review.reference,
    reference_id: target?.id,
  }
}
