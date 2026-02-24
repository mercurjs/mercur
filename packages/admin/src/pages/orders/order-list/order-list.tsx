import { OrderListTable } from "./components/order-list-table"

import { SingleColumnPage } from "../../../components/layout/pages"

export const OrderList = () => {
  return (
    <SingleColumnPage
      hasOutlet={false}
      data-testid="orders-list-page"
    >
      <OrderListTable />
    </SingleColumnPage>
  )
}
