// Route: /products/:id/variants/create
// Create product variant modal

import { useParams } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { useProduct } from "@hooks/api/products"

// Import form component
import { CreateProductVariantForm } from "./_components/create-product-variant-form"

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
