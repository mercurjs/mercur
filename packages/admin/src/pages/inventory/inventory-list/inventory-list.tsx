import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { InventoryListTable } from "./components/inventory-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <div data-testid="inventory-page">
      <SingleColumnPage>
        {Children.count(children) > 0 ? children : <InventoryListTable />}
      </SingleColumnPage>
    </div>
  )
}

export const InventoryItemListTable = Object.assign(Root, {
  Table: InventoryListTable,
})
