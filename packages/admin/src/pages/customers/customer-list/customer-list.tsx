import { ReactNode } from "react"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  CustomerListTable,
  CustomerListHeader,
  CustomerListTitle,
  CustomerListActions,
  CustomerListCreateButton,
  CustomerListDataTable,
} from "./components/customer-list-table"

const ALLOWED_TYPES = [CustomerListTable] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <CustomerListTable />}
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
