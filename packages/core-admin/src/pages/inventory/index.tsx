import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { InventoryListTable } from "./_components/inventory-list-table"

export const nav = {
  id: "inventory",
  labelKey: "navigation.items.inventory",
  iconKey: "circle-stack",
  section: "catalog",
  order: 30,
}

const InventoryList = () => {
  const { getWidgets } = useExtension()

  return (
    <div data-testid="inventory-page">
      <SingleColumnPage
        widgets={{
          after: getWidgets("inventory_item.list.after"),
          before: getWidgets("inventory_item.list.before"),
        }}
        hasOutlet
      >
        <InventoryListTable />
      </SingleColumnPage>
    </div>
  )
}

export const Component = InventoryList
