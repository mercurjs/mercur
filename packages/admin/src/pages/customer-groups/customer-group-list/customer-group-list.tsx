import { Children, ReactNode } from "react"

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
      {Children.count(children) > 0 ? children : <CustomerGroupListTable />}
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
