import { RouteFocusModal } from "@components/modals"
import { ReturnReasonCreateForm } from "./_components/return-reason-create-form"

const ReturnReasonCreate = () => {
  return (
    <RouteFocusModal>
      <ReturnReasonCreateForm />
    </RouteFocusModal>
  )
}

export const Component = ReturnReasonCreate
