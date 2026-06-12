import { UIMatch } from "react-router-dom"

import { useOffer } from "../../../../../hooks/api/offers"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../common/constants"

type VariantBreadcrumbProps = UIMatch<{
  product_variant?: { title?: string | null }
}>

export const Breadcrumb = (props: VariantBreadcrumbProps) => {
  const offerId = props.params?.offer_id
  const { offer } = useOffer(
    offerId!,
    { fields: OFFER_VARIANT_DETAIL_FIELDS },
    { initialData: props.data, enabled: Boolean(offerId) },
  )

  if (!offer) return null
  return <span>{offer.product_variant?.title ?? offerId}</span>
}
