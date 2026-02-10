// Route: /orders
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { OrderListTable } from "./_components/order-list-table"

export const Component = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("order.list.after"),
        before: getWidgets("order.list.before"),
      }}
      hasOutlet={false}
    >
      <OrderListTable />
    </SingleColumnPage>
  )
}
