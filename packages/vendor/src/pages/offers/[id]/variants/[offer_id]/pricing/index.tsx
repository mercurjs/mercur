import { useParams } from "react-router-dom"

import { RouteFocusModal } from "../../../../../../components/modals"
import { useOffer } from "../../../../../../hooks/api/offers"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../../common/constants"
import { OfferDetail } from "../../../../common/types"
import { PricingForm } from "../../../pricing/pricing-form"

/** Edit Price modal for a single offer, reached from the variant detail. */
export const OfferVariantPricingPage = () => {
  const { offer_id } = useParams()
  const { offer, isPending, isError, error } = useOffer(offer_id!, {
    fields: OFFER_VARIANT_DETAIL_FIELDS,
  })

  if (isError) throw error

  return (
    <RouteFocusModal data-testid="offer-variant-pricing-modal">
      {!isPending && offer && <PricingForm offer={offer as OfferDetail} />}
    </RouteFocusModal>
  )
}

export const Component = OfferVariantPricingPage
