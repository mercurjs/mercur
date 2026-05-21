import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "../../../../components/modals"
import { useOffer } from "../../../../hooks/api/offers"
import { useStore } from "../../../../hooks/api/store"
import { OFFER_DETAIL_FIELDS } from "../../common/constants"
import { OfferDetail } from "../../common/types"
import { PricingForm } from "./pricing-form"

export const OfferPricingEditPage = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const { offer, isPending, isError, error } = useOffer(id!, {
    fields: OFFER_DETAIL_FIELDS,
  })
  const { store, isPending: isStorePending } = useStore({
    fields: "+supported_currencies",
  })

  if (isError) throw error

  const currencies = (
    (store?.supported_currencies as
      | HttpTypes.AdminStore["supported_currencies"]
      | undefined) ?? []
  ).map((c) => c.currency_code)

  const ready = !isPending && !!offer && !isStorePending && currencies.length > 0

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("offers.pricing.header")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("offers.pricing.description")}</span>
      </RouteFocusModal.Description>
      {ready && (
        <PricingForm
          offer={offer as OfferDetail}
          currencies={currencies}
        />
      )}
    </RouteFocusModal>
  )
}

export const Component = OfferPricingEditPage
