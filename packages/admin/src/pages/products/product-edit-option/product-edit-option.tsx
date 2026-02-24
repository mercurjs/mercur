import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../components/modals"
import { useProduct } from "../../../hooks/api/products"
import { CreateProductOptionForm } from "./components/edit-product-option-form"

export const ProductEditOption = () => {
  const { id, option_id } = useParams()
  const { t } = useTranslation()

  const { product, isPending, isFetching, isError, error } = useProduct(id!)

  const option = product?.options?.find((o) => o.id === option_id)

  if (!isPending && !isFetching && !option) {
    throw new Response(JSON.stringify({ message: `An option with ID ${option_id} was not found` }), { status: 404, headers: { "Content-Type": "application/json" } })
  }

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="product-edit-option-drawer">
      <RouteDrawer.Header data-testid="product-edit-option-drawer-header">
        <RouteDrawer.Title asChild data-testid="product-edit-option-drawer-title">
          <Heading data-testid="product-edit-option-drawer-title-text">{t("products.options.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {option && <CreateProductOptionForm option={option} />}
    </RouteDrawer>
  )
}
