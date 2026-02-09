import { ReactNode } from "react"
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useProduct } from "@hooks/api/products"

import { PricingEdit } from "./pricing-edit"
import {
  ProductPricesProvider,
  useProductPricesContext,
} from "./product-prices-context"

function Content() {
  const { product, variantId, isLoading } = useProductPricesContext()

  if (isLoading || !product) {
    return null
  }

  return <PricingEdit product={product} variantId={variantId} />
}

export interface ProductPricesModalProps {
  children?: ReactNode
}

function Root({ children }: ProductPricesModalProps) {
  const { id, variant_id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!)

  if (isError) {
    throw error
  }

  return (
    <ProductPricesProvider
      value={{
        product: product!,
        variantId: variant_id,
        isLoading,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteFocusModal data-testid="product-prices-modal">
        {children ?? <Content />}
      </RouteFocusModal>
    </ProductPricesProvider>
  )
}

export const ProductPricesModal = Object.assign(Root, {
  Content,
  useContext: useProductPricesContext,
})
