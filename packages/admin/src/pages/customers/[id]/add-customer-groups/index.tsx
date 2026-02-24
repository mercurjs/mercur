// Route: /customers/:id/add-customer-groups
// Add customer to groups modal

import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { AddCustomerGroupsForm } from "./_components/add-customer-groups-form"

export const Component = () => {
  const { id } = useParams()

  return (
    <RouteFocusModal>
      <AddCustomerGroupsForm customerId={id!} />
    </RouteFocusModal>
  )
}
