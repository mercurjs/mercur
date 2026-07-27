import { Children, ReactNode } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import { ReturnReasonListTable } from "./components/return-reason-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      <WidgetZone id="return-reasons.list">
        {Children.count(children) > 0 ? children : <ReturnReasonListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ReturnReasonList = Object.assign(Root, {
  Table: ReturnReasonListTable,
})
