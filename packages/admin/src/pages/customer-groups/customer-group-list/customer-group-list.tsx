import { Children, ReactNode } from "react"
import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  CustomerGroupListTable,
  CustomerGroupListHeader,
  CustomerGroupListTitle,
  CustomerGroupListActions,
  CustomerGroupListCreateButton,
  CustomerGroupListDataTable,
} from "./components/customer-group-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="customer-groups.list">
        {Children.count(children) > 0 ? children : <CustomerGroupListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const CustomerGroupListPage = Object.assign(Root, {
  Table: CustomerGroupListTable,
  Header: CustomerGroupListHeader,
  HeaderTitle: CustomerGroupListTitle,
  HeaderActions: CustomerGroupListActions,
  HeaderCreateButton: CustomerGroupListCreateButton,
  DataTable: CustomerGroupListDataTable,
})
