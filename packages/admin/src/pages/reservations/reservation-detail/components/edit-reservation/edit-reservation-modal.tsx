import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import {
  SectionNoAccess,
  useLinkQuery,
  usePermissions,
} from "@mercurjs/dashboard-shared"
import { RouteDrawer } from "../../../../../components/modals"
import { useInventoryItem } from "../../../../../hooks/api/inventory"
import { useReservationItem } from "../../../../../hooks/api/reservations"
import { useStockLocations } from "../../../../../hooks/api/stock-locations"
import { EditReservationForm } from "./components/edit-reservation-form"

export const ReservationEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canViewInventoryItems = can("inventory_items")
  const canViewLocations = can("stock_locations")

  const { reservation, isPending, isError, error } = useReservationItem(
    id!,
    useLinkQuery("reservation")
  )
  const { inventory_item: inventoryItem } = useInventoryItem(
    reservation?.inventory_item_id ?? "",
    undefined,
    {
      enabled: !!reservation?.inventory_item_id && canViewInventoryItems,
    }
  )
  const { stock_locations } = useStockLocations(
    {
      id: inventoryItem?.location_levels?.map(
        (level) => level.location_id
      ),
      fields: "+seller.id",
    },
    {
      enabled: !!inventoryItem?.location_levels && canViewLocations,
    }
  )

  const ready = !isPending && reservation && inventoryItem && stock_locations
  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("inventory.reservation.editItemDetails")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {(!canViewInventoryItems || !canViewLocations) && <SectionNoAccess />}
      {ready && (
        <EditReservationForm
          locations={stock_locations}
          reservation={reservation}
          item={inventoryItem}
        />
      )}
    </RouteDrawer>
  )
}
