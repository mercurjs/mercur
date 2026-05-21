import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useOffer } from "../../../hooks/api/offers"
import { OFFER_DETAIL_FIELDS } from "../common/constants"
import { OfferDetail } from "../common/types"
import {
  OfferGeneralSection,
  OfferInventorySection,
  OfferPricingSection,
  OfferShippingSection,
  OfferStatusSidebar,
} from "./_components"
import { loader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>
  const {
    offer,
    isPending: isLoading,
    isError,
    error,
  } = useOffer(
    id!,
    { fields: OFFER_DETAIL_FIELDS },
    { initialData },
  )

  if (isError) {
    throw error
  }

  if (isLoading || !offer) {
    return (
      <TwoColumnPageSkeleton
        showJSON
        mainSections={3}
        sidebarSections={2}
        showMetadata
      />
    )
  }

  const typedOffer = offer as OfferDetail

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={typedOffer} showJSON showMetadata hasOutlet>
          <TwoColumnPage.Main>
            <OfferGeneralSection offer={typedOffer} />
            <OfferPricingSection offer={typedOffer} />
            <OfferInventorySection offer={typedOffer} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <OfferStatusSidebar offer={typedOffer} />
            <OfferShippingSection offer={typedOffer} />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  )
}

export const OfferDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  General: OfferGeneralSection,
  Pricing: OfferPricingSection,
  Inventory: OfferInventorySection,
  Shipping: OfferShippingSection,
  StatusSidebar: OfferStatusSidebar,
})
