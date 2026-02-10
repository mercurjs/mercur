import { InventoryTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "@components/modals"
import {
  useInventoryItem,
  useInventoryItemLevels,
} from "@hooks/api/inventory"
import { useReservationItem } from "@hooks/api/reservations"
import { useStockLocations } from "@hooks/api/stock-locations"
import { EditReservationForm } from "./components/edit-reservation-form"

export const ReservationEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { reservation, isPending, isError, error } = useReservationItem(id!)
  const { inventory_item: inventoryItem } = useInventoryItem(
    reservation?.inventory_item_id!,
    undefined,
    {
      enabled: !!reservation?.inventory_item_id,
    }
  )

  const { location_levels } = useInventoryItemLevels(inventoryItem?.id!, undefined, {
    enabled: !!inventoryItem?.id,
  })

  const { stock_locations } = useStockLocations(
    undefined,
    {
      enabled: !!location_levels,
    },
    {
      id: location_levels?.map(
        (l: InventoryTypes.InventoryLevelDTO) => l.location_id
      ),
    }
  )

  const ready = !isPending && reservation && inventoryItem && location_levels && stock_locations
  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("inventory.reservation.editItemDetails")}</Heading>
      </RouteDrawer.Header>
      {ready && (
        <EditReservationForm
          locations={stock_locations}
          reservation={reservation}
          item={{ ...inventoryItem, location_levels }}
        />
      )}
    </RouteDrawer>
  )
}
