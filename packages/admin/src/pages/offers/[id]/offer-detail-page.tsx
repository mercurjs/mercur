import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useProduct } from "../../../hooks/api/products"
import { ProductMediaSection } from "../../products/product-detail/components/product-media-section/product-media-section"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"
import { OfferProduct } from "../common/types"
import {
  OfferAssociatedProductSection,
  OfferDetailGeneralSection,
  OfferVariantsSection,
} from "./_components"
import { loader } from "./loader"

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

  const typed = product as OfferProduct

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={typed} hasOutlet>
          <TwoColumnPage.Main>
            <OfferDetailGeneralSection product={typed} />
            <ProductMediaSection product={typed} readOnly />
            <OfferVariantsSection
              variants={typed.variants}
              thumbnail={typed.thumbnail}
            />
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
  Media: ProductMediaSection,
  Variants: OfferVariantsSection,
  AssociatedProduct: OfferAssociatedProductSection,
})

export const Component = Root
