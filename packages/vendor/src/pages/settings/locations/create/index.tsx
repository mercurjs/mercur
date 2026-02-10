import { RouteFocusModal } from "@components/modals"
import { CreateLocationForm } from "./_components/create-location-form"

const LocationCreate = () => {
  return (
    <RouteFocusModal>
      <CreateLocationForm />
    </RouteFocusModal>
  )
}

export const Component = LocationCreate
