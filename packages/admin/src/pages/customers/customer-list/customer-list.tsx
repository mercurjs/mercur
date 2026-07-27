import { ReactNode, Children } from "react"
import { WidgetZone } from "@mercurjs/dashboard-shared"
import { SingleColumnPage } from "../../../components/layout/pages"
import {
  CustomerListTable,
  CustomerListHeader,
  CustomerListTitle,
  CustomerListActions,
  CustomerListCreateButton,
  CustomerListDataTable,
} from "./components/customer-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="customers.list">
        {Children.count(children) > 0 ? children : <CustomerListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const CustomerListPage = Object.assign(Root, {
  Table: CustomerListTable,
  Header: CustomerListHeader,
  HeaderTitle: CustomerListTitle,
  HeaderActions: CustomerListActions,
  HeaderCreateButton: CustomerListCreateButton,
  DataTable: CustomerListDataTable,
})
