// Route: /inventory/create
import { RouteFocusModal } from "@components/modals"
import { useStockLocations } from "@hooks/api"
import { InventoryCreateForm } from "./inventory-create-form"

export const Component = () => {
  const { isPending, stock_locations, isError, error } = useStockLocations({ limit: 9999, fields: "id,name" })
  const ready = !isPending && !!stock_locations

  if (isError) throw error

  return (
    <RouteFocusModal>
      {ready && <InventoryCreateForm locations={stock_locations} />}
    </RouteFocusModal>
  )
}
