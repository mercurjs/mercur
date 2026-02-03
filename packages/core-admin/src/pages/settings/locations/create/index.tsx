import { RouteFocusModal } from "@components/modals"

import { CreateLocationForm } from "@pages/settings/locations/location-create/components/create-location-form"

const LocationCreate = () => {
  return (
    <RouteFocusModal data-testid="location-create-modal">
      <CreateLocationForm />
    </RouteFocusModal>
  )
}

export const Component = LocationCreate
