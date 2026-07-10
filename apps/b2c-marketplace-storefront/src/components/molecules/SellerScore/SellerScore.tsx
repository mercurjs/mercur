import { StarRating } from "@/components/atoms"

export const SellerScore = ({
  rate,
  reviewCount,
}: {
  rate: number
  reviewCount: number
}) => {
  return (
    <div className="flex items-center flex-col label-md h-full py-12">
      <h3 className="heading-sm uppercase mb-2">Seller score</h3>
      <div className="flex gap-2 items-center mb-4 text-secondary">
        <StarRating rate={rate} starSize={16} /> {rate.toFixed(1)}
      </div>
      <p className="text-secondary">{reviewCount} reviews</p>
    </div>
  )
}
