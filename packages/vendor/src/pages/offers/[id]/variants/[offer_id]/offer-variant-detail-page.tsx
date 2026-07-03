import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../../../components/common/skeleton"
import { TwoColumnPage } from "../../../../../components/layout/pages"
import { useOffer } from "../../../../../hooks/api/offers"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../common/constants"
import { OfferDetail } from "../../../common/types"
import { OfferInventorySection } from "../../_components/offer-inventory-section"
import { OfferPricingSection } from "../../_components/offer-pricing-section"
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
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={2} />
  }

  const typed = offer as unknown as OfferDetail & OfferVariantData

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={typed} hasOutlet>
          <TwoColumnPage.Main>
            <OfferVariantGeneralSection offer={typed} />
            <OfferInventorySection offer={typed} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <OfferVariantShippingSection offer={typed} />
            <OfferPricingSection offer={typed} />
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
})

export const Component = Root
