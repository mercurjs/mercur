import { useParams } from "react-router-dom"

import { usePriceList } from "@hooks/api/price-lists"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { PriceListGeneralSection } from "./_components/price-list-general-section"
import { PriceListProductSection } from "./_components/price-list-product-section"
import { PriceListConfigurationSection } from "./_components/price-list-configuration-section"

const PriceListDetails = () => {
  const { id } = useParams()

  const { price_list, isLoading, isError, error } = usePriceList(id!)
  const { getWidgets } = useExtension()

  if (isLoading || !price_list) {
    return (
      <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets("price_list.details.after"),
        before: getWidgets("price_list.details.before"),
        sideAfter: getWidgets("price_list.details.side.after"),
        sideBefore: getWidgets("price_list.details.side.before"),
      }}
      data={price_list}
      showJSON
      hasOutlet
    >
      <TwoColumnPage.Main>
        <PriceListGeneralSection priceList={price_list} />
        <PriceListProductSection priceList={price_list} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <PriceListConfigurationSection priceList={price_list} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const Component = PriceListDetails
export { pricingLoader as loader } from "./loader"
export { PriceListDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
