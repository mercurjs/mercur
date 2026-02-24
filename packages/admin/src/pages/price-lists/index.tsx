import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { PriceListListTable } from "./_components/price-list-list-table"

export const nav = {
  id: "price-lists",
  labelKey: "navigation.items.priceLists",
  iconKey: "credit-card",
  section: "sales",
  order: 60,
}

const PriceListList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("price_list.list.after"),
        before: getWidgets("price_list.list.before"),
      }}
      hasOutlet
    >
      <PriceListListTable />
    </SingleColumnPage>
  )
}

export const Component = PriceListList
