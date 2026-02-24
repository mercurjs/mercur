import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useProduct } from "../../../hooks/api/products"
import { PRODUCT_DETAIL_FIELDS } from "../product-detail/constants"
import { EditProductForm } from "./components/edit-product-form"

export const ProductEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: PRODUCT_DETAIL_FIELDS,
  })

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="product-edit-drawer">
      <RouteDrawer.Header data-testid="product-edit-drawer-header">
        <RouteDrawer.Title asChild data-testid="product-edit-drawer-title">
          <Heading data-testid="product-edit-drawer-title-text">{t("products.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only" data-testid="product-edit-drawer-description">
          {t("products.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isLoading && product && <EditProductForm product={product} />}
    </RouteDrawer>
  )
}
