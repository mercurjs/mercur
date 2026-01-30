// Route: /customers/:id/create-address
// Customer address creation modal

import { RouteFocusModal } from "@components/modals"
import { CreateCustomerAddressForm } from "./_components/create-customer-address-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <CreateCustomerAddressForm />
    </RouteFocusModal>
  )
}
