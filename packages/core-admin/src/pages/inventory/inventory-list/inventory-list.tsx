import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { InventoryListTable } from "./components/inventory-list-table"

export const InventoryItemListTable = () => {
  const { getWidgets } = useExtension()

  return (
    <div data-testid="inventory-page">
      <SingleColumnPage
        widgets={{
          after: getWidgets("inventory_item.list.after"),
          before: getWidgets("inventory_item.list.before"),
        }}
      >
        <InventoryListTable />
      </SingleColumnPage>
    </div>
  )
}
