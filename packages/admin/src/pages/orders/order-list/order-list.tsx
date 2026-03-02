import { Children, ReactNode } from "react"

import {
  OrderListTable,
  OrderListHeader,
  OrderListTitle,
  OrderListDataTable,
} from "./components/order-list-table"
import { SingleColumnPage } from "../../../components/layout/pages"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage
      hasOutlet={false}
      data-testid="orders-list-page"
    >
      {Children.count(children) > 0 ? children : <OrderListTable />}
    </SingleColumnPage>
  )
}

export const OrderListPage = Object.assign(Root, {
  Table: OrderListTable,
  Header: OrderListHeader,
  HeaderTitle: OrderListTitle,
  DataTable: OrderListDataTable,
})
