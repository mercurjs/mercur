// Route: /products/:id/shipping-profile
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { PRODUCT_DETAIL_FIELDS } from "@pages/products/common/constants"
import { ProductShippingProfileForm } from "./_components/product-shipping-profile-form"

export const Component = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: PRODUCT_DETAIL_FIELDS,
  })

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="product-shipping-profile-drawer">
      <RouteDrawer.Header data-testid="product-shipping-profile-drawer-header">
        <RouteDrawer.Title asChild data-testid="product-shipping-profile-drawer-title">
          <Heading data-testid="product-shipping-profile-drawer-title-text">{t("products.shippingProfile.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && product && (
        <ProductShippingProfileForm product={product} />
      )}
    </RouteDrawer>
  )
}
