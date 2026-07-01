import { StarRating } from "@/components/atoms"
import { SingleProductReview } from "@/types/product"
import { Divider } from "@medusajs/ui"
import clsx from "clsx"
import { formatDistanceToNow } from "date-fns"

export const SellerReview = ({ review }: { review: SingleProductReview }) => {
  return (
    <div className={clsx("gap-2 flex flex-col justify-center", review.seller_note && "border-b pb-4 mb-4")}>
      <div className="items-center flex gap-3">
        <StarRating starSize={14} rate={Number(review.rating.toFixed(1))} />
        <div className="flex gap-2 items-center">
          <p className="label-md text-primary truncate">
            {review.customer.first_name} {review.customer.last_name}
          </p>
          <Divider
            orientation="vertical"
            className="h-[10px] border-disabled"
          />
          <p className="label-md text-secondary">
            {formatDistanceToNow(new Date(review.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
      <div className="w-5/6">
        <p className="text-md whitespace-pre-line break-words text-primary">
          {review.customer_note}
        </p>
        {review.seller_note && (
          <div className="mt-4 flex gap-4">
            <Divider orientation="vertical" className="h-auto" />
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <p className="label-md text-primary">
                  Reply from {review.seller.name}
                </p>
                <Divider
                  orientation="vertical"
                  className="h-[10px] border-disabled"
                />

                <p className="label-md text-secondary">
                  {formatDistanceToNow(new Date(review.updated_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <p className="label-sm">{review.seller_note}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
