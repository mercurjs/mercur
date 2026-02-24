import { useSearchParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"

import { ReservationCreateForm } from "./_components/reservation-create-form"

const ReservationCreate = () => {
  const [params] = useSearchParams()

  const inventoryItemId = params.get("item_id")

  return (
    <RouteFocusModal>
      <ReservationCreateForm inventoryItemId={inventoryItemId} />
    </RouteFocusModal>
  )
}

export const Component = ReservationCreate
