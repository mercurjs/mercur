import { ReactNode } from "react"
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useProduct } from "@hooks/api/products"

import { EditSalesChannelsForm } from "./edit-sales-channels-form"
import {
  ProductSalesChannelsProvider,
  useProductSalesChannelsContext,
} from "./product-sales-channels-context"

function Content() {
  const { product, isLoading } = useProductSalesChannelsContext()

  if (isLoading || !product) {
    return null
  }

  return <EditSalesChannelsForm product={product} />
}

export interface ProductSalesChannelsModalProps {
  children?: ReactNode
}

function Root({ children }: ProductSalesChannelsModalProps) {
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!)

  if (isError) {
    throw error
  }

  return (
    <ProductSalesChannelsProvider
      value={{
        product: product!,
        isLoading,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteFocusModal data-testid="product-sales-channels-modal">
        {children ?? <Content />}
      </RouteFocusModal>
    </ProductSalesChannelsProvider>
  )
}

export const ProductSalesChannelsModal = Object.assign(Root, {
  Content,
  useContext: useProductSalesChannelsContext,
})
