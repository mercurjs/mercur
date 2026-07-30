import { AdminReviewResponse } from "@mercurjs/types"
import { UIMatch } from "react-router-dom"

import { useReview } from "../../../hooks/api/reviews"
import { REVIEW_DETAIL_FIELDS } from "./constants"

type ReviewDetailBreadcrumbProps = UIMatch<AdminReviewResponse>

export const ReviewDetailBreadcrumb = (props: ReviewDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { review } = useReview(
    id!,
    { fields: REVIEW_DETAIL_FIELDS },
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  if (!review) {
    return null
  }

  return <span>#{review.display_id}</span>
}
