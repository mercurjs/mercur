import { RouteDrawer } from "@components/modals"
import { useInventoryItem, useStockLocation } from "@hooks/api"
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { AdjustInventoryForm } from "@routes/inventory/inventory-detail/components/adjust-inventory/components/adjust-inventory-form"

export const AdjustInventoryDrawer = () => {
  const { id, location_id } = useParams()
  const { t } = useTranslation()
  const {
    inventory_item: inventoryItem,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItem(id!)

  const inventoryLevel = inventoryItem?.location_levels!.find(
    (level) =>
      level.location_id === location_id
  )

  const { stock_location, isLoading: isLoadingLocation } = useStockLocation(
    location_id!
  )

  const ready =
    !isLoading &&
    inventoryItem &&
    inventoryLevel &&
    !isLoadingLocation &&
    stock_location

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="inventory-adjust-inventory-drawer">
      <RouteDrawer.Header data-testid="inventory-adjust-inventory-drawer-header">
        <Heading data-testid="inventory-adjust-inventory-drawer-title">{t("inventory.manageLocationQuantity")}</Heading>
      </RouteDrawer.Header>
      {ready && (
        <AdjustInventoryForm
          item={inventoryItem}
          level={inventoryLevel}
          location={stock_location}
        />
      )}
    </RouteDrawer>
  )
}
