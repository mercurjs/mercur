// Route: /price-lists
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { PriceListListTable } from "./_components/price-list-list-table"

export const Component = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("price_list.list.after"),
        before: getWidgets("price_list.list.before"),
      }}
    >
      <PriceListListTable />
    </SingleColumnPage>
  )
}
