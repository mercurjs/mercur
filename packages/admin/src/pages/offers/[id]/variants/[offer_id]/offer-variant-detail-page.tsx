import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { WidgetZone } from "@mercurjs/dashboard-shared"
import { TwoColumnPageSkeleton } from "../../../../../components/common/skeleton"
import { TwoColumnPage } from "../../../../../components/layout/pages"
import { useOffer } from "../../../../../hooks/api/offers"
import { OfferDTO } from "@mercurjs/types"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../common/constants"
import { OfferDetail } from "../../../common/types"
import { OfferInventorySection } from "../../_components/offer-inventory-section"
import { OfferPricingSection } from "../../_components/offer-pricing-section"
import { OfferStoreSidebar } from "../../_components/offer-store-sidebar"
import {
  OfferVariantGeneralSection,
  type OfferVariantData,
} from "./_components/offer-variant-general-section"
import { OfferVariantShippingSection } from "./_components/offer-variant-shipping-section"
import { loader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { offer_id } = useParams()
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const {
    offer,
    isPending: isLoading,
    isError,
    error,
  } = useOffer(
    offer_id!,
    { fields: OFFER_VARIANT_DETAIL_FIELDS },
    { initialData },
  )

  if (isError) {
    throw error
  }

  if (isLoading || !offer) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={3} />
  }

  const typed = offer as unknown as OfferDetail &
    OfferVariantData &
    Pick<OfferDTO, "shipping_profile">

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={typed} hasOutlet>
          <TwoColumnPage.Main>
            <WidgetZone id="offer-variants.detail.main" data={typed}>
              <OfferVariantGeneralSection offer={typed} />
              <OfferInventorySection offer={typed} />
            </WidgetZone>
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <WidgetZone id="offer-variants.detail.side" data={typed}>
              <OfferVariantShippingSection offer={typed} />
              <OfferPricingSection offer={typed} />
              <OfferStoreSidebar seller={typed.seller} />
            </WidgetZone>
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  )
}

export const OfferVariantDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  General: OfferVariantGeneralSection,
  Inventory: OfferInventorySection,
  Shipping: OfferVariantShippingSection,
  Pricing: OfferPricingSection,
  Store: OfferStoreSidebar,
})

export const Component = Root
