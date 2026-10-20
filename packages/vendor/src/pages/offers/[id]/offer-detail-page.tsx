import { useLoaderData, useParams } from "react-router-dom"

import { Container } from "@medusajs/ui"
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  isForbidden,
  LayoutComposer,
  SectionNoAccess,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { useProduct } from "../../../hooks/api/products"
import { ProductMediaSection } from "../../products/[id]/_components/product-media-section"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"
import { OfferProduct } from "../common/types"
import { OfferDetailGeneralSection } from "./_components/offer-detail-general-section"
import { OfferVariantsSection } from "./_components/offer-variants-section"
import { OfferAssociatedProductSection } from "./_components/offer-associated-product-section"
import { loader } from "./loader"

export const OfferDetailPage = () => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>
  const query = useLinkQuery("offer", OFFER_PRODUCT_DETAIL_FIELDS)

  const { product, isLoading, isError, error } = useProduct(id!, query, {
    initialData,
  })

  if (isError) {
    if (isForbidden(error)) {
      return (
        <Container className="p-0">
          <SectionNoAccess />
        </Container>
      )
    }
    throw error
  }

  if (isLoading || !product) {
    return <TwoColumnPageSkeleton mainSections={3} sidebarSections={1} />
  }

  const typed = product as OfferProduct

  return (
    <LayoutComposer
      widgetsZonePrefix="offers.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={typed}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="OfferDetailGeneralSection">
              <OfferDetailGeneralSection product={typed} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ProductMediaSection">
              <ProductMediaSection product={typed} readOnly />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="OfferVariantsSection">
              <OfferVariantsSection
                variants={typed.variants}
                thumbnail={typed.thumbnail}
              />
            </LayoutComposer.Entry>
          </>
        ),
        side: (
          <LayoutComposer.Entry id="OfferAssociatedProductSection">
            <OfferAssociatedProductSection product={typed} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  )
}

export const Component = OfferDetailPage
