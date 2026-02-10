// Route: /customers/:id/add-customer-groups
import { useParams } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { AddCustomerGroupsForm } from "./add-customers-form"

export const Component = () => {
  const { id } = useParams()
  return (
    <RouteFocusModal>
      <AddCustomerGroupsForm customerId={id!} />
    </RouteFocusModal>
  )
}
