import { RouteFocusModal } from "../../../components/modals"
import { CreateSalesChannelForm } from "./components/create-sales-channel-form"

export const SalesChannelCreate = () => {
  return (
    <RouteFocusModal data-testid="sales-channel-create-modal">
      <CreateSalesChannelForm />
    </RouteFocusModal>
  )
}
