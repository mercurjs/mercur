import { Children, ReactNode } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  InventoryListTable,
  InventoryListHeader,
  InventoryListTitle,
  InventoryListActions,
  InventoryListDataTable,
} from "./components/inventory-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <div data-testid="inventory-page">
      <SingleColumnPage>
        <WidgetZone id="inventory.list">
          {Children.count(children) > 0 ? children : <InventoryListTable />}
        </WidgetZone>
      </SingleColumnPage>
    </div>
  )
}

export const InventoryListPage = Object.assign(Root, {
  Table: InventoryListTable,
  Header: InventoryListHeader,
  HeaderTitle: InventoryListTitle,
  HeaderActions: InventoryListActions,
  DataTable: InventoryListDataTable,
})
