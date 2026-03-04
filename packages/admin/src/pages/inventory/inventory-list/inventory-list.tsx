import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  InventoryListTable,
  InventoryListHeader,
  InventoryListTitle,
  InventoryListActions,
  InventoryListCreateButton,
  InventoryListDataTable,
} from "./components/inventory-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <div data-testid="inventory-page">
      <SingleColumnPage>
        {Children.count(children) > 0 ? children : <InventoryListTable />}
      </SingleColumnPage>
    </div>
  )
}

export const InventoryListPage = Object.assign(Root, {
  Table: InventoryListTable,
  Header: InventoryListHeader,
  HeaderTitle: InventoryListTitle,
  HeaderActions: InventoryListActions,
  HeaderCreateButton: InventoryListCreateButton,
  DataTable: InventoryListDataTable,
})
