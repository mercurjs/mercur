import { RouteFocusModal } from "@components/modals"

import { CreateSalesChannelForm } from "./_components/create-sales-channel-form"

const SalesChannelCreate = () => {
  return (
    <RouteFocusModal data-testid="sales-channel-create-modal">
      <CreateSalesChannelForm />
    </RouteFocusModal>
  )
}

export const Component = SalesChannelCreate
