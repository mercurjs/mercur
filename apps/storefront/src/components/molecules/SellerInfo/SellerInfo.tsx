import { SellerDTO } from "@mercurjs/types"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { SellerInfoHeader } from "../SellerInfoHeader/SellerInfoHeader"

export const SellerInfo = ({
  seller,
  header = false,
  showArrow = false,
  bottomBorder = false,
  showReviews = false,
}: {
  seller: SellerDTO
  header?: boolean
  showArrow?: boolean
  bottomBorder?: boolean
  showReviews?: boolean
}) => {
  const { logo, name } = seller

  const headerContent = (
    <SellerInfoHeader
      photo={logo ?? ""}
      name={name}
      showArrow={showArrow}
      bottomBorder={bottomBorder}
      showReviews={showReviews}
    />
  )

  return (
    <div className="flex flex-col w-full">
      {showArrow ? (
        <LocalizedClientLink
          href={`/sellers/${seller.handle}`}
          aria-label={`View ${name} seller`}
        >
          {headerContent}
        </LocalizedClientLink>
      ) : (
        headerContent
      )}
    </div>
  )
}
