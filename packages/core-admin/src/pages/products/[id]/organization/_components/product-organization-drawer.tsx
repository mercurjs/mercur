import { Heading } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { PRODUCT_DETAIL_FIELDS } from "@pages/products/common/constants"
import { ProductOrganizationForm } from "./product-organization-form"
import {
  ProductOrganizationProvider,
  useProductOrganizationContext,
} from "./product-organization-context"

function Root({ children }: { children: ReactNode }) {
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: PRODUCT_DETAIL_FIELDS,
  })

  if (isError) {
    throw error
  }

  return (
    <ProductOrganizationProvider
      value={{
        product: product!,
        isLoading,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteDrawer data-testid="product-organization-drawer">
        {children}
      </RouteDrawer>
    </ProductOrganizationProvider>
  )
}

function Header() {
  const { t } = useTranslation()

  return (
    <RouteDrawer.Header data-testid="product-organization-drawer-header">
      <RouteDrawer.Title
        asChild
        data-testid="product-organization-drawer-title"
      >
        <Heading data-testid="product-organization-drawer-title-text">
          {t("products.organization.edit.header")}
        </Heading>
      </RouteDrawer.Title>
    </RouteDrawer.Header>
  )
}

function Form() {
  const { product, isLoading } = useProductOrganizationContext()

  if (isLoading || !product) {
    return null
  }

  return <ProductOrganizationForm product={product} />
}

export const ProductOrganizationDrawer = Object.assign(Root, {
  Header,
  Form,
  useContext: useProductOrganizationContext,
})
