import { Children, ReactNode } from "react"
import { useLoaderData, useParams, useSearchParams } from "react-router-dom"

import { useLinkQuery, WidgetZone } from "@mercurjs/dashboard-shared"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useProduct } from "../../../hooks/api/products"
import { ProductMediaSection } from "../../products/product-detail/components/product-media-section/product-media-section"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"
import { OfferProduct } from "../common/types"
import {
  OfferAssociatedProductSection,
  OfferDetailGeneralSection,
  OfferDetailStoreSection,
  OfferVariantsSection,
} from "./_components"
import { loader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const sellerId = searchParams.get("seller_id") ?? undefined
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>
  const linkQuery = useLinkQuery("offer", OFFER_PRODUCT_DETAIL_FIELDS)

  const { product, isLoading, isError, error } = useProduct(
    id!,
    { ...linkQuery, seller_id: sellerId },
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
              <OfferDetailStoreSection sellerId={sellerId} />
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
  Store: OfferDetailStoreSection,
})

export const Component = Root
