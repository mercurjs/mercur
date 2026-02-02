import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { AddCustomersForm } from "./_components/add-customers-form"

export const Component = () => {
  const { id } = useParams()

  return (
    <RouteFocusModal>
      <AddCustomersForm customerGroupId={id!} />
    </RouteFocusModal>
  )
}
