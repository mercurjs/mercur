// Route: /reservations/create
import { useSearchParams } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { ReservationCreateForm } from "./reservation-create-from"

export const Component = () => {
  const [params] = useSearchParams()

  const inventoryItemId = params.get("item_id")

  return (
    <RouteFocusModal>
      <ReservationCreateForm inventoryItemId={inventoryItemId ?? undefined} />
    </RouteFocusModal>
  )
}
