import { Heading } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useLoaderData, useParams, useSearchParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct, useProductVariant } from "@hooks/api/products"

import { ProductEditVariantForm } from "./product-edit-variant-form"
import { editProductVariantLoader } from "../loader"
import {
  VariantEditProvider,
  useVariantEditContext,
} from "./variant-edit-context"

function Root({ children }: { children?: ReactNode }) {
  const initialData = useLoaderData() as
    | Awaited<ReturnType<typeof editProductVariantLoader>>
    | undefined

  const { id, variant_id } = useParams()
  const [URLSearchParams] = useSearchParams()
  const searchVariantId = URLSearchParams.get("variant_id")

  const { variant, isPending, isError, error } = useProductVariant(
    id!,
    variant_id || searchVariantId!,
    undefined,
    {
      initialData,
    }
  )

  const {
    product,
    isPending: isProductPending,
    isError: isProductError,
    error: productError,
  } = useProduct(
    variant?.product_id!,
    {
      fields: "-variants",
    },
    {
      enabled: !!variant?.product_id,
    }
  )

  if (isError) {
    throw error
  }

  if (isProductError) {
    throw productError
  }

  const isLoading = isPending || isProductPending
  const ready = !isPending && !!variant && !isProductPending && !!product

  return (
    <VariantEditProvider
      value={{
        variant: variant!,
        product: product!,
        isLoading,
        isError: isError || isProductError,
        error: (error || productError) as Error | null,
      }}
    >
      <RouteDrawer data-testid="product-variant-edit-drawer">
        {children ?? (
          <>
            <Header />
            {ready && <Form />}
          </>
        )}
      </RouteDrawer>
    </VariantEditProvider>
  )
}

function Header() {
  const { t } = useTranslation()

  return (
    <RouteDrawer.Header data-testid="product-variant-edit-drawer-header">
      <RouteDrawer.Title
        asChild
        data-testid="product-variant-edit-drawer-title"
      >
        <Heading data-testid="product-variant-edit-drawer-title-text">
          {t("products.variant.edit.header")}
        </Heading>
      </RouteDrawer.Title>
    </RouteDrawer.Header>
  )
}

function Form() {
  const { variant, product, isLoading } = useVariantEditContext()

  if (isLoading || !variant || !product) {
    return null
  }

  return <ProductEditVariantForm variant={variant} product={product} />
}

export const VariantEditDrawer = Object.assign(Root, {
  Header,
  Form,
  useContext: useVariantEditContext,
})
