"use client"

import { SellerInfo } from "@/components/molecules"
import { SellerDTO } from "@mercurjs/types"
import { HttpTypes } from "@medusajs/types"
import {
  StoreOffer,
  getBuyboxWinner,
  getVariantOffers,
} from "@/lib/helpers/buybox"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"

export const ProductDetailsSeller = ({
  seller,
  product,
  offers = [],
}: {
  seller?: SellerDTO
  product?: HttpTypes.StoreProduct
  offers?: StoreOffer[]
}) => {
  const { allSearchParams } = useGetAllSearchParams()

  let activeSeller = seller

  if (product && offers.length) {
    const { cheapestVariant, cheapestPrice } = getProductPrice({ product })
    const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

    const selectedVariant = hasAnyPrice
      ? {
          ...(cheapestVariant.options?.reduce(
            (
              acc: Record<string, string>,
              varopt: HttpTypes.StoreProductOptionValue
            ) => {
              acc[varopt.option?.title.toLowerCase() || ""] = varopt.value
              return acc
            },
            {}
          ) ?? {}),
          ...allSearchParams,
        }
      : allSearchParams

    const variantId =
      product.variants?.find(({ options }: { options: any }) =>
        options?.every((option: any) =>
          selectedVariant[option.option?.title.toLowerCase() || ""]?.includes(
            option.value
          )
        )
      )?.id || ""

    const variantOffers = getVariantOffers(offers, variantId)
    const winnerOffer = getBuyboxWinner(variantOffers)
    if (winnerOffer?.seller) {
      activeSeller = winnerOffer.seller
    }
  }

  if (!activeSeller) return null

  return (
    <div className="border rounded-sm">
      <div>
        <div className="flex justify-between">
          <SellerInfo
            seller={activeSeller}
            showArrow
            bottomBorder
            showReviews={false}
          />
        </div>
      </div>
    </div>
  )
}

