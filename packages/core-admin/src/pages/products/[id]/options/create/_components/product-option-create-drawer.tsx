import { Heading } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { CreateProductOptionForm } from "./create-product-option-form"
import {
  ProductOptionCreateProvider,
  useProductOptionCreateContext,
} from "./product-option-create-context"

function Root({ children }: { children: ReactNode }) {
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!)

  if (isError) {
    throw error
  }

  return (
    <ProductOptionCreateProvider
      value={{
        product: product!,
        isLoading,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteDrawer data-testid="product-option-create-drawer">
        {children}
      </RouteDrawer>
    </ProductOptionCreateProvider>
  )
}

function Header() {
  const { t } = useTranslation()

  return (
    <RouteDrawer.Header data-testid="product-option-create-drawer-header">
      <RouteDrawer.Title
        asChild
        data-testid="product-option-create-drawer-title"
      >
        <Heading data-testid="product-option-create-drawer-title-text">
          {t("products.options.create.header")}
        </Heading>
      </RouteDrawer.Title>
    </RouteDrawer.Header>
  )
}

function Form() {
  const { product, isLoading } = useProductOptionCreateContext()

  if (isLoading || !product) {
    return null
  }

  return <CreateProductOptionForm product={product} />
}

export const ProductOptionCreateDrawer = Object.assign(Root, {
  Header,
  Form,
  useContext: useProductOptionCreateContext,
})
