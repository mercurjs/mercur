// Route: /products/:id/variants/create
import { useParams } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { CreateProductVariantForm } from "./create-product-variant-form"

export const Component = () => {
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {!isLoading && product && <CreateProductVariantForm product={product} />}
    </RouteFocusModal>
  )
}
