import { RouteFocusModal } from "@components/modals"
import { CreateShippingProfileForm } from "./_components/create-shipping-profile-form"

export const Component = () => {
  return (
    <RouteFocusModal data-testid="shipping-profile-create-modal">
      <CreateShippingProfileForm />
    </RouteFocusModal>
  )
}
