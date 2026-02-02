import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { PriceListListTable } from "./_components/price-list-list-table"

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
