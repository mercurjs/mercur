import { RouteFocusModal } from "../../../components/modals"
import { CreateLocationForm } from "./components/create-location-form"

export const LocationCreate = () => {
  return (
    <RouteFocusModal data-testid="location-create-modal">
      <CreateLocationForm />
    </RouteFocusModal>
  )
}
