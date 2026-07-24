import { SellerInfo } from "@/components/molecules"
import { SellerDTO } from "@mercurjs/types"

export const ProductDetailsSeller = ({ seller }: { seller?: SellerDTO }) => {
  if (!seller) return null

  return (
    <div className="border rounded-sm">
      <div>
          <div className="flex justify-between">
            <SellerInfo seller={seller} showArrow bottomBorder showReviews={false} />
          </div>
      </div>
    </div>
  )
}
