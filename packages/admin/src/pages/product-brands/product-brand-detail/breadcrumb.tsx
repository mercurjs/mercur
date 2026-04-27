import { UIMatch } from "react-router-dom"

import { HttpTypes } from "@mercurjs/types"
import { useProductBrand } from "../../../hooks/api"

type ProductBrandDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminProductBrandResponse>

export const ProductBrandDetailBreadcrumb = (
  props: ProductBrandDetailBreadcrumbProps
) => {
  const { id } = props.params || {}

  const { product_brand } = useProductBrand(id!, undefined, {
    initialData: props.data,
    enabled: Boolean(id),
  })

  if (!product_brand) {
    return null
  }

  return <span>{product_brand.name}</span>
}
