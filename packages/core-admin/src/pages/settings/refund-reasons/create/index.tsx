import { RouteFocusModal } from "@components/modals"
import { RefundReasonCreateForm } from "./_components/refund-reason-create-form"

export const Component = () => {
  return (
    <RouteFocusModal data-testid="refund-reason-create-modal">
      <RefundReasonCreateForm />
    </RouteFocusModal>
  )
}
