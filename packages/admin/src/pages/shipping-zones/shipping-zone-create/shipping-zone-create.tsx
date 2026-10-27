import { RouteFocusModal } from "../../../components/modals"
import { CreateShippingZoneForm } from "./components/create-shipping-zone-form"

export const ShippingZoneCreate = () => {
  return (
    <RouteFocusModal data-testid="shipping-zone-create-modal">
      <CreateShippingZoneForm />
    </RouteFocusModal>
  )
}
