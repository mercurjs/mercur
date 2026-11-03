import { ProductDetailsFooter } from '@/components/cells/ProductDetailsFooter/ProductDetailsFooter';
import { ProductDetailsHeader } from '@/components/cells/ProductDetailsHeader/ProductDetailsHeader';
import { ProductDetailsSeller } from '@/components/cells/ProductDetailsSeller/ProductDetailsSeller';
import { ProductDetailsShipping } from '@/components/cells/ProductDetailsShipping/ProductDetailsShipping';
import { ProductPageDetails } from '@/components/cells/ProductPageDetails/ProductPageDetails';
import { ProductAdditionalAttributes } from '@/components/cells/ProductAdditionalAttributes/ProductAdditionalAttributes';

import {
  getBuyboxWinner,
  rankOffers,
  StoreOffer,
} from "@/lib/helpers/buybox"
import { HttpTypes } from "@medusajs/types"
import type { WrappedProductAttributeDTO } from "@mercurjs/types"

export const ProductDetails = ({
  product,
  locale,
  offers = [],
  user,
}: {
  product: HttpTypes.StoreProduct & {
    attributes?: WrappedProductAttributeDTO[]
  }
  locale: string
  offers?: StoreOffer[]
  user: HttpTypes.StoreCustomer | null
}) => {
  // Master products have no seller; the seller shown comes from the buybox
  // winning offer.
  const seller = getBuyboxWinner(rankOffers(offers))?.seller

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
      <ProductAdditionalAttributes attributes={product?.attributes || []} />
      <ProductDetailsShipping />
      <ProductDetailsSeller seller={seller} />
      <ProductDetailsFooter
        tags={product?.tags || []}
        posted={product?.created_at}
      />
    </div>
  )
}
