import { UIMatch } from "react-router-dom"

import { useProduct } from "../../../hooks/api/products"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../common/constants"

type OfferBreadcrumbProps = UIMatch<{ product?: { title?: string | null } }>

export const Breadcrumb = (props: OfferBreadcrumbProps) => {
  const { id } = props.params || {}
  const { product } = useProduct(
    id!,
    { fields: OFFER_PRODUCT_DETAIL_FIELDS },
    { initialData: props.data, enabled: Boolean(id) },
  )

  if (!product) return null
  return <span>{product.title ?? id}</span>
}
