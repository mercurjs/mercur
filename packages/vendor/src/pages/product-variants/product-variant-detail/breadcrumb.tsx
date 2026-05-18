import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { useProductVariant } from "@hooks/api"

type ProductVariantDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminProductVariantResponse>

export const ProductVariantDetailBreadcrumb = (
  props: ProductVariantDetailBreadcrumbProps
) => {
  const { product_id, variant_id } = props.params || {}

  const { variant } = useProductVariant(
    product_id!,
    variant_id!,
    {},
    {
      initialData: props.data,
      enabled: Boolean(product_id) && Boolean(variant_id),
    }
  )
  if (!variant) {
    return null
  }

  return <span>{variant.title}</span>
}
