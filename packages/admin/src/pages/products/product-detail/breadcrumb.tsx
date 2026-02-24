import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { useProduct } from "../../../hooks/api"
import { PRODUCT_DETAIL_FIELDS } from "./constants"

type ProductDetailBreadcrumbProps = UIMatch<HttpTypes.AdminProductResponse>

export const ProductDetailBreadcrumb = (
  props: ProductDetailBreadcrumbProps
) => {
  const { id } = props.params || {}

  const { product } = useProduct(
    id!,
    {
      fields: PRODUCT_DETAIL_FIELDS,
    },
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  if (!product) {
    return null
  }

  return <span>{product.title}</span>
}
