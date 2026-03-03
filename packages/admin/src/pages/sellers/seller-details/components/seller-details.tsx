import { ReactNode } from "react"
import { useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../../components/common/skeleton"
import { TwoColumnPage } from "../../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../../lib/compound-composition"
import { useSeller } from "@/hooks/api"
import { SellerGeneralSection } from "./seller-general-section"
import { SellerAddressSection } from "./seller-address-section"
import { SellerOrderSection } from "./seller-order-section"
import { SellerProductSection } from "./seller-product-section"

const ALLOWED_TYPES = [
  TwoColumnPage.Main,
  TwoColumnPage.Sidebar,
  SellerGeneralSection,
  SellerOrderSection,
  SellerProductSection,
  SellerAddressSection,
] as const

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const { seller, isLoading, isError, error } = useSeller(id!)

  if (isLoading || !seller) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <TwoColumnPage data={seller} hasOutlet showJSON showMetadata data-testid="seller-detail-page">
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={seller} hasOutlet showJSON showMetadata data-testid="seller-detail-page">
      <TwoColumnPage.Main>
        <SellerGeneralSection seller={seller} />
        <SellerOrderSection sellerId={seller.id} />
        <SellerProductSection sellerId={seller.id} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <SellerAddressSection seller={seller} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const SellerDetails = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: SellerGeneralSection,
  MainOrderSection: SellerOrderSection,
  MainProductSection: SellerProductSection,
  SidebarAddressSection: SellerAddressSection,
})
