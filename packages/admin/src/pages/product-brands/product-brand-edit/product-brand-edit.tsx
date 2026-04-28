import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../components/modals"
import { useProductBrand } from "../../../hooks/api/product-brands"
import { EditProductBrandForm } from "./components/edit-product-brand-form"

export const ProductBrandEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { product_brand, isPending, isError, error } = useProductBrand(id!)

  const ready = !isPending && !!product_brand

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="product-brand-edit-drawer">
      <RouteDrawer.Header data-testid="product-brand-edit-drawer-header">
        <Heading data-testid="product-brand-edit-drawer-heading">
          {t("productBrands.edit.header")}
        </Heading>
      </RouteDrawer.Header>
      {ready && <EditProductBrandForm productBrand={product_brand} />}
    </RouteDrawer>
  )
}
