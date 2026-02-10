// Route: /customers/create
import { RouteFocusModal } from "@components/modals"
import { CreateCustomerForm } from "./create-customer-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <CreateCustomerForm />
    </RouteFocusModal>
  )
}
