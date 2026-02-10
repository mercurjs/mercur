// Route: /products/:id/prices OR /products/:product_id/variants/:variant_id/prices
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { PricingEdit } from "./pricing-edit"

export const Component = () => {
  const { id, product_id, variant_id } = useParams()
  const productId = id || product_id

  const { product, isLoading, isError, error } = useProduct(productId!)

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {!isLoading && product && (
        <PricingEdit product={product} variantId={variant_id} />
      )}
    </RouteFocusModal>
  )
}
