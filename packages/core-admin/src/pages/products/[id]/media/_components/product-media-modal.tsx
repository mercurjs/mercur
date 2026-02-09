import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useProduct } from "@hooks/api/products"

import { ProductMediaView } from "./product-media-view"
import {
  ProductMediaProvider,
  useProductMediaContext,
} from "./product-media-context"

function Title() {
  const { t } = useTranslation()
  return (
    <>
      <RouteFocusModal.Title
        asChild
        data-testid="product-media-modal-title"
      >
        <span
          className="sr-only"
          data-testid="product-media-modal-title-text"
        >
          {t("products.media.label")}
        </span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description
        asChild
        data-testid="product-media-modal-description"
      >
        <span
          className="sr-only"
          data-testid="product-media-modal-description-text"
        >
          {t("products.media.editHint")}
        </span>
      </RouteFocusModal.Description>
    </>
  )
}

function Content() {
  const { product, isLoading } = useProductMediaContext()

  if (isLoading || !product) {
    return null
  }

  return <ProductMediaView product={product} />
}

export interface ProductMediaModalProps {
  children?: ReactNode
}

function Root({ children }: ProductMediaModalProps) {
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!)

  if (isError) {
    throw error
  }

  return (
    <ProductMediaProvider
      value={{
        product: product!,
        isLoading,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteFocusModal data-testid="product-media-modal">
        {children ?? (
          <>
            <Title />
            <Content />
          </>
        )}
      </RouteFocusModal>
    </ProductMediaProvider>
  )
}

export const ProductMediaModal = Object.assign(Root, {
  Title,
  Content,
  useContext: useProductMediaContext,
})
