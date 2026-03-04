import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  SalesChannelListView,
  SalesChannelListDataTable,
  SalesChannelListHeader,
  SalesChannelListActions,
  SalesChannelListTitle,
} from "./components/sales-channel-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <SalesChannelListView />}
    </SingleColumnPage>
  )
}

export const SalesChannelListPage = Object.assign(Root, {
  Table: SalesChannelListView,
  Header: SalesChannelListHeader,
  HeaderTitle: SalesChannelListTitle,
  HeaderActions: SalesChannelListActions,
  DataTable: SalesChannelListDataTable,
})
