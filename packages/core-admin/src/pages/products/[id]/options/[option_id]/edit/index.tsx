// Route: /products/:id/options/:option_id/edit
// Edit product option drawer

import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { json, useParams } from "react-router-dom"
import { RouteDrawer } from "@components/modals"
import { useProduct } from "@hooks/api/products"

// Import form component
import { CreateProductOptionForm } from "./_components/edit-product-option-form"

export const Component = () => {
  const { id, option_id } = useParams()
  const { t } = useTranslation()

  const { product, isPending, isFetching, isError, error } = useProduct(id!)

  const option = product?.options?.find((o) => o.id === option_id)

  if (!isPending && !isFetching && !option) {
    throw json({ message: `An option with ID ${option_id} was not found` }, 404)
  }

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="product-edit-option-drawer">
      <RouteDrawer.Header data-testid="product-edit-option-drawer-header">
        <RouteDrawer.Title asChild data-testid="product-edit-option-drawer-title">
          <Heading data-testid="product-edit-option-drawer-title-text">
            {t("products.options.edit.header")}
          </Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {option && <CreateProductOptionForm option={option} />}
    </RouteDrawer>
  )
}
