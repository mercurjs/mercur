import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useLoaderData, useParams, useSearchParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct, useProductVariant } from "@hooks/api/products"
import { ProductEditVariantForm } from "./components/product-edit-variant-form"
import { editProductVariantLoader } from "./loader"

export const ProductVariantEdit = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof editProductVariantLoader>
  >

  const { t } = useTranslation()
  const { id, product_id, variant_id } = useParams()
  const productId = product_id || id
  const [URLSearchParms] = useSearchParams()
  const searchVariantId = URLSearchParms.get("variant_id")

  const { variant, isPending, isError, error } = useProductVariant(
    productId!,
    variant_id || searchVariantId!,
    undefined,
    {
      initialData,
    },
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
    },
  )

  const ready = !isPending && !!variant && !isProductPending && !!product

  if (isError) {
    throw error
  }

  if (isProductError) {
    throw productError
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("products.variant.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {ready && <ProductEditVariantForm variant={variant} product={product} />}
    </RouteDrawer>
  )
}
