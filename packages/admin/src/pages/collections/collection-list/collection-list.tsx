import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  CollectionListTable,
  CollectionListDataTable,
  CollectionListHeader,
  CollectionListActions,
  CollectionListTitle,
} from "./components/collection-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="collections.list">
        {Children.count(children) > 0 ? children : <CollectionListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const CollectionListPage = Object.assign(Root, {
  Table: CollectionListTable,
  Header: CollectionListHeader,
  HeaderTitle: CollectionListTitle,
  HeaderActions: CollectionListActions,
  DataTable: CollectionListDataTable,
})
