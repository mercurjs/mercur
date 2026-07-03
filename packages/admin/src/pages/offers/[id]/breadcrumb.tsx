import { UIMatch } from "react-router-dom"

import { useProduct } from "../../../hooks/api/products"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"

export const Breadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}
  const { product } = useProduct(
    id!,
    { fields: OFFER_PRODUCT_DETAIL_FIELDS },
    { initialData: props.data as never, enabled: Boolean(id) },
  )

  if (!product) return null
  return <span>{product.title ?? id}</span>
}
