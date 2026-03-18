import { UIMatch } from "react-router-dom"

import { useReview } from "../../../hooks/api/reviews"

export const Breadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { review } = useReview(id!, undefined, {
    enabled: Boolean(id),
  })

  if (!review) {
    return null
  }

  return <span>{review.id}</span>
}
