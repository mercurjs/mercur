import { PlaceholderCell } from "../../common/placeholder-cell"
import { StarsRating } from "../../../../common/stars-rating/stars-rating"

type StarsCellProps = {
  rating?: number
}

export const StarsCell = ({ rating }: StarsCellProps) => {
  if (!rating) {
    return <PlaceholderCell />
  }

  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <StarsRating rate={rating} />
    </div>
  )
}

export const StarsHeader = () => {
  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">Stars</span>
    </div>
  )
}
