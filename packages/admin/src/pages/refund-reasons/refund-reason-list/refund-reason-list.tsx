import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  RefundReasonListTable,
  RefundReasonListDataTable,
  RefundReasonListHeader,
  RefundReasonListActions,
  RefundReasonListTitle,
} from "./components/refund-reason-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      {Children.count(children) > 0 ? children : <RefundReasonListTable />}
    </SingleColumnPage>
  )
}

export const RefundReasonList = Object.assign(Root, {
  Table: RefundReasonListTable,
  Header: RefundReasonListHeader,
  HeaderTitle: RefundReasonListTitle,
  HeaderActions: RefundReasonListActions,
  DataTable: RefundReasonListDataTable,
})
