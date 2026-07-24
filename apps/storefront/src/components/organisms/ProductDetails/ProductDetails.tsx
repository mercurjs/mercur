import {
  ProductDetailsFooter,
  ProductDetailsHeader,
  ProductDetailsSeller,
  ProductDetailsShipping,
  ProductPageDetails,
  ProductAdditionalAttributes,
} from "@/components/cells"

import { retrieveCustomer } from "@/lib/data/customer"
import {
  getBuyboxWinner,
  rankOffers,
  StoreOffer,
} from "@/lib/helpers/buybox"
import { AdditionalAttributeProps } from "@/types/product"
import { SellerProps } from "@/types/seller"
import { HttpTypes } from "@medusajs/types"

export const ProductDetails = async ({
  product,
  locale,
  offers = [],
}: {
  product: HttpTypes.StoreProduct & {
    attribute_values?: AdditionalAttributeProps[]
  }
  locale: string
  offers?: StoreOffer[]
}) => {
  const user = await retrieveCustomer()

  // Master products have no seller; the seller shown comes from the buybox
  // winning offer.
  const winnerSeller = getBuyboxWinner(rankOffers(offers))?.seller
  const seller: SellerProps | undefined = winnerSeller
    ? {
        id: winnerSeller.id,
        name: winnerSeller.name,
        handle: winnerSeller.handle,
        description: winnerSeller.description ?? "",
        photo: winnerSeller.logo ?? "",
        tax_id: "",
        created_at: String(winnerSeller.created_at ?? ""),
        email: winnerSeller.email,
      }
    : undefined

  return (
    <div>
      <ProductDetailsHeader
        product={product}
        locale={locale}
        user={user}
        offers={offers}
        seller={seller}
      />
      <ProductPageDetails details={product?.description || ""} />
      <ProductAdditionalAttributes
        attributes={product?.attribute_values || []}
      />
      <ProductDetailsShipping />
      <ProductDetailsSeller seller={seller} />
      <ProductDetailsFooter
        tags={product?.tags || []}
        posted={product?.created_at}
      />
    </div>
  )
}
