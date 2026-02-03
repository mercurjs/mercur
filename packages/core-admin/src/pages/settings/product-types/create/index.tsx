import { RouteFocusModal } from "@components/modals"
import { CreateProductTypeForm } from "./_components/create-product-type-form"

export const Component = () => {
  return (
    <RouteFocusModal data-testid="product-type-create-modal">
      <CreateProductTypeForm />
    </RouteFocusModal>
  )
}
