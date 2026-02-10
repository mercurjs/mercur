import { RouteFocusModal } from "@components/modals"
import { CreateProductTypeForm } from "./_components/create-product-type-form"

const ProductTypeCreate = () => {
  return (
    <RouteFocusModal>
      <CreateProductTypeForm />
    </RouteFocusModal>
  )
}

export const Component = ProductTypeCreate
