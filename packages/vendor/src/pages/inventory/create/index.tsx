// Route: /inventory/create
import { RouteFocusModal } from "@components/modals"
import { useStockLocations } from "@hooks/api"
import { isForbidden, SectionNoAccess } from "@mercurjs/dashboard-shared"
import { InventoryCreateForm } from "./inventory-create-form"

export const Component = () => {
  const { isPending, stock_locations, isError, error } = useStockLocations({ limit: 9999, fields: "id,name" })
  const ready = !isPending && !!stock_locations

  const forbidden = isError && isForbidden(error)

  if (isError && !forbidden) throw error

  return (
    <RouteFocusModal>
      {forbidden ? (
        <>
          <RouteFocusModal.Header />
          <RouteFocusModal.Body>
            <SectionNoAccess />
          </RouteFocusModal.Body>
        </>
      ) : (
        ready && <InventoryCreateForm locations={stock_locations} />
      )}
    </RouteFocusModal>
  )
}
