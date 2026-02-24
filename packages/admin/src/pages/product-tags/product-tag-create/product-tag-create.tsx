import { RouteFocusModal } from "../../../components/modals"
import { ProductTagCreateForm } from "./components/product-tag-create-form"

export const ProductTagCreate = () => {
  return (
    <RouteFocusModal data-testid="product-tag-create-modal">
      <ProductTagCreateForm />
    </RouteFocusModal>
  )
}
