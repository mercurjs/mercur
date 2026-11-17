import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import { LayoutComposer } from "@mercurjs/dashboard-shared"
import { TwoColumnPageSkeleton } from "../../../../../components/common/skeleton"
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

export const OfferVariantDetailPage = () => {
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
    <LayoutComposer
      widgetsZonePrefix="offer-variants.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={typed}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="OfferVariantGeneralSection">
              <OfferVariantGeneralSection offer={typed} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="OfferInventorySection">
              <OfferInventorySection offer={typed} />
            </LayoutComposer.Entry>
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="OfferVariantShippingSection">
              <OfferVariantShippingSection offer={typed} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="OfferPricingSection">
              <OfferPricingSection offer={typed} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="OfferStoreSidebar">
              <OfferStoreSidebar seller={typed.seller} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  )
}

export const Component = OfferVariantDetailPage
