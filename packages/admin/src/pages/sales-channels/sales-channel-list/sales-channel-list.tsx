import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  SalesChannelListView,
  SalesChannelListDataTable,
  SalesChannelListHeader,
  SalesChannelListActions,
  SalesChannelListTitle,
} from "./components/sales-channel-list-view"

const ALLOWED_TYPES = [SalesChannelListView] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <SalesChannelListView />}
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
