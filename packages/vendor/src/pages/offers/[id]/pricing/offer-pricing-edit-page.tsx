import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../../components/modals"
import { useOffer } from "../../../../hooks/api/offers"
import { OFFER_DETAIL_FIELDS } from "../../common/constants"
import { OfferDetail } from "../../common/types"
import { PricingForm } from "./pricing-form"

export const OfferPricingEditPage = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const { offer, isPending, isError, error } = useOffer(id!, {
    fields: OFFER_DETAIL_FIELDS,
  })

  if (isError) throw error
  const ready = !isPending && !!offer

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("offers.pricing.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("offers.pricing.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <PricingForm offer={offer as OfferDetail} />}
    </RouteDrawer>
  )
}

export const Component = OfferPricingEditPage
