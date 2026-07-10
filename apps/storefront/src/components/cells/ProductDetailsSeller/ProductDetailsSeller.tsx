import { SellerInfo } from "@/components/molecules"
import { SellerProps } from "@/types/seller"

export const ProductDetailsSeller = ({ seller }: { seller?: SellerProps }) => {
  if (!seller) return null

  return (
    <div className="border rounded-sm">
      <div>
          <div className="flex justify-between">
            <SellerInfo seller={seller} showArrow bottomBorder />
          </div>
      </div>
    </div>
  )
}
