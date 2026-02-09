import { RouteDrawer } from "@components/modals"
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useInventoryItem } from "@hooks/api"

import { EditInventoryItemAttributesForm } from "@pages/inventory/inventory-detail/components/edit-inventory-item-attributes/components/edit-item-attributes-form"

const InventoryItemAttributesEdit = () => {
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

export const Component = InventoryItemAttributesEdit
