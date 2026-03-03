import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { SalesChannelListTable } from "./components/sales-channel-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <SalesChannelListTable />}
    </SingleColumnPage>
  )
}

export const SalesChannelList = Object.assign(Root, {
  Table: SalesChannelListTable,
})
