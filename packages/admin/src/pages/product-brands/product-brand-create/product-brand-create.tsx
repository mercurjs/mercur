import { RouteFocusModal } from "../../../components/modals"
import { CreateProductBrandForm } from "./components/create-product-brand-form"

export const ProductBrandCreate = () => {
  return (
    <RouteFocusModal data-testid="product-brand-create-modal">
      <CreateProductBrandForm />
    </RouteFocusModal>
  )
}
