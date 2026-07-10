import { SellerProps } from "@/types/seller"
import { SellerReview } from "../SellerReview/SellerReview"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { SellerInfoHeader } from "../SellerInfoHeader/SellerInfoHeader"

export const SellerInfo = ({
  seller,
  header = false,
  showArrow = false,
  bottomBorder = false,
}: {
  seller: SellerProps
  header?: boolean
  showArrow?: boolean
  bottomBorder?: boolean
}) => {
  const { photo, name, reviews } = seller

  const reviewCount = reviews
    ? reviews?.filter((rev) => rev !== null).length
    : 0

  const rating =
    reviews && reviews.length > 0
      ? reviews
          .filter((rev) => rev !== null)
          .reduce((sum, r) => sum + r?.rating || 0, 0) / reviewCount
      : 0

  return (
    <div className="flex flex-col w-full">
      {showArrow ? (
        <LocalizedClientLink href={`/sellers/${seller.handle}`} aria-label={`View ${name} seller`}>
          <SellerInfoHeader
            photo={photo}
            name={name}
            rating={rating}
            reviewCount={reviewCount}
            showArrow={showArrow}
            bottomBorder={bottomBorder}
          />
        </LocalizedClientLink>
      ) : (
        <SellerInfoHeader
          photo={photo}
          name={name}
          rating={rating}
          reviewCount={reviewCount}
          showArrow={showArrow}
          bottomBorder={bottomBorder}
        />
      )}
      {!header && (
        <div className="flex flex-col gap-5 p-4">
          <h3 className="heading-sm uppercase">Seller reviews</h3>
          {reviews
            ?.filter((rev) => rev !== null)
            .slice(-3)
            .map((review) => (
              <SellerReview key={review.id} review={review} />
            ))}
        </div>
      )}
    </div>
  )
}
