import { Button, Card, StarRating } from "@/components/atoms"
import { Order } from "@/lib/data/reviews"
import { format } from "date-fns"
import Image from "next/image"

export const OrderCard = ({
  order,
  showForm,
  testIdPrefix,
}: {
  order: Order
  showForm?: (review: Order) => void
  testIdPrefix?: string
}) => {
  return (
    <Card className="flex gap-6 px-4 justify-between w-full" data-testid={testIdPrefix}>
      <div className="flex gap-4 max-lg:items-center">
        <div>
          {order?.items?.[0]?.thumbnail ? (
            <Image
              alt="Seller photo"
              src={order.items[0].thumbnail}
              className="border border-base-primary rounded-xs"
              width={64}
              height={64}
              data-testid={testIdPrefix ? `${testIdPrefix}-thumbnail` : undefined}
            />
          ) : (
            <Image
              alt="Seller photo"
              src={"/images/placeholder.svg"}
              className="opacity-25 scale-75"
              width={64}
              height={64}
              data-testid={testIdPrefix ? `${testIdPrefix}-placeholder` : undefined}
            />
          )}
        </div>
        <div>
          <p className="label-md text-primary font-normal" data-testid={testIdPrefix ? `${testIdPrefix}-seller-name` : undefined}>
            {order.seller.name}
          </p>
          <p className="label-md text-secondary" data-testid={testIdPrefix ? `${testIdPrefix}-subtitle` : undefined}>
            {order?.items?.[0]?.subtitle}
          </p>
          <p className="label-md text-secondary" data-testid={testIdPrefix ? `${testIdPrefix}-date` : undefined}>
            Date: {format(order.created_at, "MMM dd, yyyy")}
          </p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 w-1/2">
        {showForm ? (
          <div className="flex justify-end w-full">
            <Button onClick={() => showForm(order)} className="w-fit uppercase" data-testid={testIdPrefix ? `${testIdPrefix}-write-review-button` : undefined}>
              Write review
            </Button>
          </div>
        ) : (
          <div className="h-full -mt-2 max-w-full">
            <p className="text-sm text-secondary" data-testid={testIdPrefix ? `${testIdPrefix}-review-date` : undefined}>
              {format(order.reviews[0].created_at, "MMM dd, yyyy")}
            </p>
            <StarRating rate={order.reviews[0].rating} starSize={12} />
            <p className="label-md mt-2 whitespace-pre-line break-words" data-testid={testIdPrefix ? `${testIdPrefix}-review-note` : undefined}>
              {order.reviews[0].customer_note}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
