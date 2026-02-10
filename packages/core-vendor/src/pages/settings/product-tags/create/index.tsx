import { RouteFocusModal } from "@components/modals"
import { ProductTagCreateForm } from "./_components/product-tag-create-form"

const ProductTagCreate = () => {
  return (
    <RouteFocusModal>
      <ProductTagCreateForm />
    </RouteFocusModal>
  )
}

export const Component = ProductTagCreate
