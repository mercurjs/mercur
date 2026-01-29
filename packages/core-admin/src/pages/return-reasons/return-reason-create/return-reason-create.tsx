import { RouteFocusModal } from "../../../components/modals"
import { ReturnReasonCreateForm } from "./components/return-reason-create-form"

export const ReturnReasonCreate = () => {
  return (
    <RouteFocusModal data-testid="return-reason-create-modal">
      <ReturnReasonCreateForm />
    </RouteFocusModal>
  )
}
