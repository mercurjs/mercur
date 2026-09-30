import { Heading } from "@medusajs/ui"
import { SectionNoAccess, useCan } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../../../components/modals"
import { useInventoryItem } from "../../../../../hooks/api/inventory"
import { useStockLocations } from "../../../../../hooks/api/stock-locations"
import { ManageLocationsForm } from "./components/manage-locations-form"

export const ManageLocationsDrawer = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const {
    inventory_item: inventoryItem,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItem(id!, {
    fields: "id,sku,title,*location_levels,offers.seller_id",
  })

  const canViewLocations = useCan("stock_locations")
  const { stock_locations, isLoading: loadingLocations } = useStockLocations(
    undefined,
    { enabled: canViewLocations }
  )

  const ready =
    !isLoading && !loadingLocations && inventoryItem && stock_locations

  if (isError) {
    throw error
  }

  const sellerId = (
    inventoryItem as { offers?: { seller_id: string }[] } | undefined
  )?.offers?.[0]?.seller_id

  return (
    <RouteDrawer data-testid="inventory-manage-locations-drawer">
      <RouteDrawer.Header data-testid="inventory-manage-locations-drawer-header">
        <RouteDrawer.Title asChild>
          <Heading data-testid="inventory-manage-locations-drawer-title">{t("inventory.manageLocations")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!canViewLocations && <SectionNoAccess />}
      {ready && (
        <ManageLocationsForm
          item={inventoryItem}
          locations={stock_locations}
          sellerId={sellerId}
        />
      )}
    </RouteDrawer>
  )
}
