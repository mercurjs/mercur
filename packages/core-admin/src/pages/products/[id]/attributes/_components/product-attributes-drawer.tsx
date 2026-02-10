import { Heading } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { PRODUCT_DETAIL_FIELDS } from "@pages/products/common/constants"
import { ProductAttributesForm } from "./product-attributes-form"
import {
  ProductAttributesProvider,
  useProductAttributesContext,
} from "./product-attributes-context"

function Root({ children }: { children: ReactNode }) {
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: PRODUCT_DETAIL_FIELDS,
  })

  if (isError) {
    throw error
  }

  return (
    <ProductAttributesProvider
      value={{
        product: product!,
        isLoading,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteDrawer data-testid="product-attributes-drawer">
        {children}
      </RouteDrawer>
    </ProductAttributesProvider>
  )
}

function Header() {
  const { t } = useTranslation()

  return (
    <RouteDrawer.Header data-testid="product-attributes-drawer-header">
      <RouteDrawer.Title
        asChild
        data-testid="product-attributes-drawer-title"
      >
        <Heading data-testid="product-attributes-drawer-title-text">
          {t("products.editAttributes")}
        </Heading>
      </RouteDrawer.Title>
    </RouteDrawer.Header>
  )
}

function Form() {
  const { product, isLoading } = useProductAttributesContext()

  if (isLoading || !product) {
    return null
  }

  return <ProductAttributesForm product={product} />
}

export const ProductAttributesDrawer = Object.assign(Root, {
  Header,
  Form,
  useContext: useProductAttributesContext,
})
