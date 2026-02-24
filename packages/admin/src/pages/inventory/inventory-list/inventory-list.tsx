import { SingleColumnPage } from "../../../components/layout/pages"
import { InventoryListTable } from "./components/inventory-list-table"

export const InventoryItemListTable = () => {
  return (
    <div data-testid="inventory-page">
      <SingleColumnPage>
        <InventoryListTable />
      </SingleColumnPage>
    </div>
  )
}
