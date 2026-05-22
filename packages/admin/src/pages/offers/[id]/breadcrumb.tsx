import { UIMatch } from "react-router-dom"

import { useOffer } from "../../../hooks/api/offers"
import { OFFER_DETAIL_FIELDS } from "../common/constants"

export const Breadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}
  const { offer } = useOffer(
    id!,
    { fields: OFFER_DETAIL_FIELDS },
    { initialData: props.data as never, enabled: Boolean(id) },
  )

  if (!offer) return null
  return <span>{(offer as { sku?: string | null }).sku ?? id}</span>
}
