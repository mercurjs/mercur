import { Heading } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { PRODUCT_DETAIL_FIELDS } from "@pages/products/common/constants"
import { EditProductForm } from "./edit-product-form"
import {
  ProductEditProvider,
  useProductEditContext,
} from "./product-edit-context"

function Root({ children }: { children: ReactNode }) {
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: PRODUCT_DETAIL_FIELDS,
  })

  if (isError) {
    throw error
  }

  return (
    <ProductEditProvider
      value={{
        product: product!,
        isLoading,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteDrawer data-testid="product-edit-drawer">
        {children}
      </RouteDrawer>
    </ProductEditProvider>
  )
}

function Header() {
  const { t } = useTranslation()

  return (
    <RouteDrawer.Header data-testid="product-edit-drawer-header">
      <RouteDrawer.Title asChild data-testid="product-edit-drawer-title">
        <Heading data-testid="product-edit-drawer-title-text">
          {t("products.edit.header")}
        </Heading>
      </RouteDrawer.Title>
      <RouteDrawer.Description
        className="sr-only"
        data-testid="product-edit-drawer-description"
      >
        {t("products.edit.description")}
      </RouteDrawer.Description>
    </RouteDrawer.Header>
  )
}

function Form() {
  const { product, isLoading } = useProductEditContext()

  if (isLoading || !product) {
    return null
  }

  return <EditProductForm product={product} />
}

export const ProductEditDrawer = Object.assign(Root, {
  Header,
  Form,
  useContext: useProductEditContext,
})
