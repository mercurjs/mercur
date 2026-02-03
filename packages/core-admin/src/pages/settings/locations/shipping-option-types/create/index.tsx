import { RouteFocusModal } from "@components/modals"

import { CreateShippingOptionTypeForm } from "./_components/create-shipping-option-type-form"

const ShippingOptionTypeCreate = () => {
  return (
    <RouteFocusModal data-testid="shipping-option-type-create-modal">
      <CreateShippingOptionTypeForm />
    </RouteFocusModal>
  )
}

export const Component = ShippingOptionTypeCreate
