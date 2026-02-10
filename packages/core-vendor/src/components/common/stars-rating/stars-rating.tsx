import { Star, StarSolid } from "@medusajs/icons"

export const StarsRating = ({ rate }: { rate: number }) => {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, key) => {
        return key < rate ? <StarSolid key={key} /> : <Star key={key} />
      })}
    </div>
  )
}
