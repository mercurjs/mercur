import { RouteFocusModal } from "@components/modals"
import { CreateShippingProfileForm } from "./_components/create-shipping-profile-form"

function ShippingProfileCreate() {
  return (
    <RouteFocusModal>
      <CreateShippingProfileForm />
    </RouteFocusModal>
  )
}

export const Component = ShippingProfileCreate
