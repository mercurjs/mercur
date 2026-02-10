// Route: /customers/create
// Customer creation modal

import { RouteFocusModal } from "@components/modals"
import { CreateCustomerForm } from "./_components/create-customer-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <CreateCustomerForm />
    </RouteFocusModal>
  )
}
