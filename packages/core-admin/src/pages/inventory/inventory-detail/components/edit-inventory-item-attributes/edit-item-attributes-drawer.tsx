import { RouteDrawer } from "@components/modals"
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { EditInventoryItemAttributesForm } from "./components/edit-item-attributes-form"
import { useInventoryItem } from "@hooks/api"

export const InventoryItemAttributesEdit = () => {
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
    <RouteDrawer data-testid="inventory-edit-item-attributes-drawer">
      <RouteDrawer.Header data-testid="inventory-edit-item-attributes-drawer-header">
        <Heading data-testid="inventory-edit-item-attributes-drawer-title">{t("products.editAttributes")}</Heading>
      </RouteDrawer.Header>
      {ready && <EditInventoryItemAttributesForm item={inventoryItem} />}
    </RouteDrawer>
  )
}
