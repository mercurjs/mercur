import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { useLinkQuery, WidgetZone } from "@mercurjs/dashboard-shared"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useProduct } from "../../../hooks/api/products"
import { ProductMediaSection } from "../../products/[id]/_components/product-media-section"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"
import { OfferProduct } from "../common/types"
import { OfferDetailGeneralSection } from "./_components/offer-detail-general-section"
import { OfferVariantsSection } from "./_components/offer-variants-section"
import { OfferAssociatedProductSection } from "./_components/offer-associated-product-section"
import { loader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>
  const query = useLinkQuery("offer", OFFER_PRODUCT_DETAIL_FIELDS)

  const { product, isLoading, isError, error } = useProduct(id!, query, {
    initialData,
  })

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
            <WidgetZone id="offers.detail.main" data={typed}>
              <OfferDetailGeneralSection product={typed} />
              <ProductMediaSection product={typed} readOnly />
              <OfferVariantsSection
                variants={typed.variants}
                thumbnail={typed.thumbnail}
              />
            </WidgetZone>
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <WidgetZone id="offers.detail.side" data={typed}>
              <OfferAssociatedProductSection product={typed} />
            </WidgetZone>
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
