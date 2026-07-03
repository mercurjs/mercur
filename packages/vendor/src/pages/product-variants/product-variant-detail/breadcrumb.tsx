import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { useProductVariant } from "@hooks/api"

type ProductVariantDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminProductVariantResponse>

export const ProductVariantDetailBreadcrumb = (
  props: ProductVariantDetailBreadcrumbProps
) => {
  const { id, product_id, variant_id } = props.params || {}
  const productId = id || product_id

  const { variant } = useProductVariant(
    productId!,
    variant_id!,
    {},
    {
      initialData: props.data,
      enabled: Boolean(productId) && Boolean(variant_id),
    }
  )
  if (!variant) {
    return null
  }

  return <span>{variant.title}</span>
}
