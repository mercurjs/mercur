import { RouteFocusModal } from "@components/modals"
import { ProductTagCreateForm } from "./_components/product-tag-create-form"

export const Component = () => {
  return (
    <RouteFocusModal data-testid="product-tag-create-modal">
      <ProductTagCreateForm />
    </RouteFocusModal>
  )
}
