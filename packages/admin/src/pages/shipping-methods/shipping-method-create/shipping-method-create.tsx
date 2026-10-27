import { RouteFocusModal } from "../../../components/modals"
import { CreateShippingMethodForm } from "./components/create-shipping-method-form"

export const ShippingMethodCreate = () => {
  return (
    <RouteFocusModal data-testid="shipping-method-create-modal">
      <CreateShippingMethodForm />
    </RouteFocusModal>
  )
}
