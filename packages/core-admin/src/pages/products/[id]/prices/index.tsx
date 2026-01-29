// Route: /products/:id/prices
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { PricingEdit } from "./_components/pricing-edit"

export const Component = () => {
  const { id, variant_id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal data-testid="product-prices-modal">
      {!isLoading && product && (
        <PricingEdit product={product} variantId={variant_id} />
      )}
    </RouteFocusModal>
  )
}
