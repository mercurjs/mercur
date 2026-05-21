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
  OfferVariantSection,
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
        mainSections={2}
        sidebarSections={2}
      />
    )
  }

  const typedOffer = offer as OfferDetail

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={typedOffer} hasOutlet>
          <TwoColumnPage.Main>
            <OfferGeneralSection offer={typedOffer} />
            <OfferInventorySection offer={typedOffer} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <OfferVariantSection offer={typedOffer} />
            <OfferPricingSection offer={typedOffer} />
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
  Inventory: OfferInventorySection,
  Variant: OfferVariantSection,
  Pricing: OfferPricingSection,
})

export const Component = Root
