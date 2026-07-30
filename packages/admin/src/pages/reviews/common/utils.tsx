import { StarSolid } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { ReviewStatus } from "@mercurjs/types"

export const getReviewStatusColor = (
  status: ReviewStatus
): "green" | "orange" | "red" | "grey" => {
  switch (status) {
    case "published":
      return "green"
    case "pending":
      return "orange"
    case "rejected":
      return "red"
    default:
      return "grey"
  }
}

export const StarRating = ({
  rating,
  className,
}: {
  rating: number
  className?: string
}) => {
  const value = Math.max(0, Math.min(5, Math.round(rating)))

  return (
    <div
      className={clx("flex items-center gap-x-0.5", className)}
      aria-label={`${value} / 5`}
    >
      {Array.from({ length: 5 }).map((_, index) =>
        index < value ? (
          <StarSolid key={index} className="text-ui-tag-orange-icon" />
        ) : (
          <StarSolid
            key={index}
            className="text-ui-tag-orange-icon opacity-30"
          />
        )
      )}
    </div>
  )
}
