// Route: /customer-groups/create
import { RouteFocusModal } from "@components/modals"
import { CreateCustomerGroupForm } from "./create-customer-group-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <CreateCustomerGroupForm />
    </RouteFocusModal>
  )
}
