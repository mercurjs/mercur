import { useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { usePriceList } from "../../../hooks/api/price-lists"
import { PriceListConfigurationSection } from "./components/price-list-configuration-section"
import { PriceListCustomerAvailabilitySection } from "./components/price-list-customer-availability-section"
import { PriceListGeneralSection } from "./components/price-list-general-section"
import { PriceListProductSection } from "./components/price-list-product-section"

export const PriceListDetailPage = () => {
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

  return (
    <LayoutComposer
      widgetsZonePrefix="price-lists.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={price_list}
      data-testid="price-list-detail-page"
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="PriceListGeneralSection">
              <PriceListGeneralSection priceList={price_list} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PriceListCustomerAvailabilitySection">
              <PriceListCustomerAvailabilitySection priceList={price_list} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PriceListProductSection">
              <PriceListProductSection priceList={price_list} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(price_list, { metadata: false })}
          </>
        ),
        side: (
          <LayoutComposer.Entry id="PriceListConfigurationSection">
            <PriceListConfigurationSection priceList={price_list} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  )
}
