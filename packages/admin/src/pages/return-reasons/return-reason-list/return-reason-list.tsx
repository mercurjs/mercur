import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { ReturnReasonListTable } from "./components/return-reason-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      {Children.count(children) > 0 ? children : <ReturnReasonListTable />}
    </SingleColumnPage>
  )
}

export const ReturnReasonList = Object.assign(Root, {
  Table: ReturnReasonListTable,
})
