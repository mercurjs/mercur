import { RouteFocusModal } from "@components/modals"
import { ReturnReasonCreateForm } from "./_components/return-reason-create-form"

export const Component = () => {
  return (
    <RouteFocusModal data-testid="return-reason-create-modal">
      <ReturnReasonCreateForm />
    </RouteFocusModal>
  )
}
