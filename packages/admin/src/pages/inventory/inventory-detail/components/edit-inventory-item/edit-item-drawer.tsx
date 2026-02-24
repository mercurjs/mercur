import { RouteDrawer } from "@components/modals"
import { useInventoryItem } from "@hooks/api"
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { EditInventoryItemForm } from "./components/edit-item-form"

export const InventoryItemEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const {
    inventory_item: inventoryItem,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItem(id!)

  const ready = !isLoading && inventoryItem

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="inventory-edit-item-drawer">
      <RouteDrawer.Header data-testid="inventory-edit-item-drawer-header">
        <Heading data-testid="inventory-edit-item-drawer-title">{t("inventory.editItemDetails")}</Heading>
      </RouteDrawer.Header>
      {ready && <EditInventoryItemForm item={inventoryItem} />}
    </RouteDrawer>
  )
}
