import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useProduct } from "../../../hooks/api/products"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"
import { OfferDetailGeneralSection } from "./_components/offer-detail-general-section"
import { OfferMediaSection } from "./_components/offer-media-section"
import {
  OfferVariantsSection,
  type OfferVariant,
} from "./_components/offer-variants-section"
import { OfferAssociatedProductSection } from "./_components/offer-associated-product-section"
import { loader } from "./loader"

type OfferDetailProductData = {
  id: string
  title?: string | null
  subtitle?: string | null
  description?: string | null
  handle?: string | null
  discountable?: boolean | null
  status?: string | null
  thumbnail?: string | null
  images?: Array<{ id: string; url: string }> | null
  variants?: OfferVariant[] | null
}

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const { product, isLoading, isError, error } = useProduct(
    id!,
    { fields: OFFER_PRODUCT_DETAIL_FIELDS },
    { initialData },
  )

  if (isError) {
    throw error
  }

  if (isLoading || !product) {
    return <TwoColumnPageSkeleton mainSections={3} sidebarSections={1} />
  }

  const typed = product as unknown as OfferDetailProductData

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={typed} hasOutlet>
          <TwoColumnPage.Main>
            <OfferDetailGeneralSection product={typed} />
            <OfferMediaSection product={typed} />
            <OfferVariantsSection variants={typed.variants} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <OfferAssociatedProductSection product={typed} />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  )
}

export const OfferDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  General: OfferDetailGeneralSection,
  Media: OfferMediaSection,
  Variants: OfferVariantsSection,
  AssociatedProduct: OfferAssociatedProductSection,
})

export const Component = Root
