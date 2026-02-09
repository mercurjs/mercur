import { Heading } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { json, useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { CreateProductOptionForm } from "./edit-product-option-form"
import {
  ProductOptionEditProvider,
  useProductOptionEditContext,
} from "./product-option-edit-context"

function Root({ children }: { children: ReactNode }) {
  const { id, option_id } = useParams()

  const { product, isPending, isFetching, isError, error } = useProduct(id!)

  const option = product?.options?.find((o) => o.id === option_id)

  if (!isPending && !isFetching && !option) {
    throw json(
      { message: `An option with ID ${option_id} was not found` },
      404
    )
  }

  if (isError) {
    throw error
  }

  return (
    <ProductOptionEditProvider
      value={{
        option: option!,
        product: product!,
        isLoading: isPending || isFetching,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteDrawer data-testid="product-edit-option-drawer">
        {children}
      </RouteDrawer>
    </ProductOptionEditProvider>
  )
}

function Header() {
  const { t } = useTranslation()

  return (
    <RouteDrawer.Header data-testid="product-edit-option-drawer-header">
      <RouteDrawer.Title
        asChild
        data-testid="product-edit-option-drawer-title"
      >
        <Heading data-testid="product-edit-option-drawer-title-text">
          {t("products.options.edit.header")}
        </Heading>
      </RouteDrawer.Title>
    </RouteDrawer.Header>
  )
}

function Form() {
  const { option } = useProductOptionEditContext()

  if (!option) {
    return null
  }

  return <CreateProductOptionForm option={option} />
}

export const ProductOptionEditDrawer = Object.assign(Root, {
  Header,
  Form,
  useContext: useProductOptionEditContext,
})
