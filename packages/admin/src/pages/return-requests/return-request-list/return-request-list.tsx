import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ReturnRequestListDataTable,
  ReturnRequestListHeader,
  ReturnRequestListTable,
  ReturnRequestListTitle,
} from "./components/return-request-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <ReturnRequestListTable />}
    </SingleColumnPage>
  )
}

export const ReturnRequestListPage = Object.assign(Root, {
  Table: ReturnRequestListTable,
  Header: ReturnRequestListHeader,
  HeaderTitle: ReturnRequestListTitle,
  DataTable: ReturnRequestListDataTable,
})
