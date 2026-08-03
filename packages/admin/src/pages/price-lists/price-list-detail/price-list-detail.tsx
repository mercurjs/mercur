import { ReactNode, Children } from "react"
import { useParams } from "react-router-dom"

import { useLinkQuery, WidgetZone } from "@mercurjs/dashboard-shared"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { usePriceList } from "../../../hooks/api/price-lists"
import { PriceListConfigurationSection } from "./components/price-list-configuration-section"
import { PriceListCustomerAvailabilitySection } from "./components/price-list-customer-availability-section"
import { PriceListGeneralSection } from "./components/price-list-general-section"
import { PriceListProductSection } from "./components/price-list-product-section"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const linkQuery = useLinkQuery("price_list", "+prices.id")
  const { price_list, isLoading, isError, error } = usePriceList(id!, linkQuery)

  if (isLoading || !price_list) {
    return (
      <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={price_list} showJSON data-testid="price-list-detail-page">
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={price_list} showJSON data-testid="price-list-detail-page">
      <TwoColumnPage.Main>
        <WidgetZone id="price-lists.detail.main" data={price_list}>
          <PriceListGeneralSection priceList={price_list} />
          <PriceListCustomerAvailabilitySection priceList={price_list} />
          <PriceListProductSection priceList={price_list} />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="price-lists.detail.side" data={price_list}>
          <PriceListConfigurationSection priceList={price_list} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const PriceListDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: PriceListGeneralSection,
  MainCustomerAvailabilitySection: PriceListCustomerAvailabilitySection,
  MainProductSection: PriceListProductSection,
  SidebarConfigurationSection: PriceListConfigurationSection,
})
