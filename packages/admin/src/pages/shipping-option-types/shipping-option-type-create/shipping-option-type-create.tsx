import { RouteFocusModal } from "../../../components/modals"
import { CreateShippingOptionTypeForm } from "./components/create-shipping-option-type-form"

export const ShippingOptionTypeCreate = () => {
  return (
    <RouteFocusModal data-testid="shipping-option-type-create-modal">
      <CreateShippingOptionTypeForm />
    </RouteFocusModal>
  )
}
