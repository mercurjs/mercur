import { ReviewReference } from "@mercurjs/types"

export const linkedReviewFields = ["id", "reference", "product.id", "seller.id"]

export type LinkedReview = {
  id: string
  reference: ReviewReference
  product?: { id: string } | null
  seller?: { id: string } | null
}

export type ReviewEventData = {
  id: string
  reference: ReviewReference
  reference_id: string
}

export const buildReviewEventData = (
  reviews: LinkedReview[]
): ReviewEventData[] =>
  reviews.flatMap((review) => {
    const target =
      review.reference === "product" ? review.product : review.seller

    return target
      ? [{ id: review.id, reference: review.reference, reference_id: target.id }]
      : []
  })
