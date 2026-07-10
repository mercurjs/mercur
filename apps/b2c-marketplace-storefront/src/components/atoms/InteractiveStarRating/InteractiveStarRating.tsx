"use client"
import { StarIcon } from "@/icons"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Props {
  onChange: (rating: number) => void
  value?: number
  error?: boolean
  "data-testid"?: string
}

export const InteractiveStarRating = ({
  onChange,
  value = 0,
  error,
  "data-testid": dataTestId,
}: Props) => {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div
      className={cn("flex gap-1", error && "text-negative")}
      onMouseLeave={() => setHoverRating(0)}
      data-testid={dataTestId}
    >
      {[...Array(5)].map((_, index) => {
        const starNumber = index + 1
        const isActive = hoverRating
          ? starNumber <= hoverRating
          : starNumber <= value

        return (
          <button
            key={index}
            type="button"
            className="p-1 hover:scale-110 transition-transform bg-transparent"
            onMouseEnter={() => setHoverRating(starNumber)}
            onClick={() => onChange(starNumber)}
            data-testid={dataTestId ? `${dataTestId}-button` : 'interactive-star-rating-button'}
          >
            <StarIcon
              size={24}
              className={cn(
                isActive ? "[&>path]:fill-secondary" : "[&>path]:fill-gray-200"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
