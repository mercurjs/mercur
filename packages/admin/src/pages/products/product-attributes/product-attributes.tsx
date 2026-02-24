import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useProduct } from "../../../hooks/api/products"
import { PRODUCT_DETAIL_FIELDS } from "../product-detail/constants"
import { ProductAttributesForm } from "./components/product-attributes-form"

export const ProductAttributes = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: PRODUCT_DETAIL_FIELDS,
  })

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="product-attributes-drawer">
      <RouteDrawer.Header data-testid="product-attributes-drawer-header">
        <RouteDrawer.Title asChild data-testid="product-attributes-drawer-title">
          <Heading data-testid="product-attributes-drawer-title-text">{t("products.editAttributes")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && product && <ProductAttributesForm product={product} />}
    </RouteDrawer>
  )
}
