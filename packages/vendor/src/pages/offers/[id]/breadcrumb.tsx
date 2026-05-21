import { UIMatch } from "react-router-dom"

import { useOffer } from "../../../hooks/api/offers"
import { OFFER_DETAIL_FIELDS } from "../common/constants"

type OfferBreadcrumbProps = UIMatch<{ offer?: { sku?: string | null } }>

export const Breadcrumb = (props: OfferBreadcrumbProps) => {
  const { id } = props.params || {}
  const { offer } = useOffer(
    id!,
    { fields: OFFER_DETAIL_FIELDS },
    { initialData: props.data, enabled: Boolean(id) },
  )

  if (!offer) return null
  return <span>{offer.sku ?? id}</span>
}
