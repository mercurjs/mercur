import { useParams } from "react-router-dom"

import { RouteFocusModal } from "../../../../components/modals"
import { useOffer } from "../../../../hooks/api/offers"
import { OFFER_DETAIL_FIELDS } from "../../common/constants"
import { OfferDetail } from "../../common/types"
import { PricingForm } from "./pricing-form"

export const OfferPricingEditPage = () => {
  const { id } = useParams()
  const { offer, isPending, isError, error } = useOffer(id!, {
    fields: OFFER_DETAIL_FIELDS,
  })

  if (isError) throw error

  return (
    <RouteFocusModal data-testid="offer-pricing-modal">
      {!isPending && offer && <PricingForm offer={offer as OfferDetail} />}
    </RouteFocusModal>
  )
}

export const Component = OfferPricingEditPage
