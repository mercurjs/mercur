import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"
import { OrderListTable } from "./_components/order-list-table"

export const nav = {
  id: "orders",
  labelKey: "navigation.items.orders",
  iconKey: "shopping-cart",
  section: "sales",
  order: 10,
}

export const Component = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("order.list.after"),
        before: getWidgets("order.list.before"),
      }}
      hasOutlet={false}
      data-testid="orders-list-page"
    >
      <OrderListTable />
    </SingleColumnPage>
  )
}
