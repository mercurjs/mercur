import { RouteFocusModal } from "../../../components/modals"
import { CreateCustomerAddressForm } from "./components/create-customer-address-form"

export const CustomerCreateAddress = () => {
  return (
    <RouteFocusModal>
      <CreateCustomerAddressForm />
    </RouteFocusModal>
  )
}
