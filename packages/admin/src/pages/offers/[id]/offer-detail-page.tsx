import { useLoaderData, useParams, useSearchParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  isForbidden,
  LayoutComposer,
  SectionNoAccess,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
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

export const OfferDetailPage = () => {
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
    if (isForbidden(error)) {
      return <SectionNoAccess />
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
          <>
            <LayoutComposer.Entry id="OfferAssociatedProductSection">
              <OfferAssociatedProductSection product={typed} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="OfferDetailStoreSection">
              <OfferDetailStoreSection sellerId={sellerId} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  )
}

export const Component = OfferDetailPage
