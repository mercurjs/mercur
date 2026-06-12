import { UIMatch } from "react-router-dom"

import { useOffer } from "../../../../../hooks/api/offers"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../common/constants"

export const Breadcrumb = (props: UIMatch) => {
  const offerId = props.params?.offer_id
  const { offer } = useOffer(
    offerId!,
    { fields: OFFER_VARIANT_DETAIL_FIELDS },
    { initialData: props.data as never, enabled: Boolean(offerId) },
  )

  if (!offer) return null
  const variant = (offer as { product_variant?: { title?: string | null } })
    .product_variant
  return <span>{variant?.title ?? offerId}</span>
}
