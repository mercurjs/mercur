import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  StoreListTable,
  StoreListDataTable,
  StoreListHeader,
  StoreListActions,
  StoreListTitle,
} from "./components/store-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      <WidgetZone id="stores.list">
        {Children.count(children) > 0 ? children : <StoreListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const StoreListPage = Object.assign(Root, {
  Table: StoreListTable,
  Header: StoreListHeader,
  HeaderTitle: StoreListTitle,
  HeaderActions: StoreListActions,
  DataTable: StoreListDataTable,
})
