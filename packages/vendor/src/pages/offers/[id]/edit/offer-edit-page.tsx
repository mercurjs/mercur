import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../../components/modals"
import { useOffer } from "../../../../hooks/api/offers"
import { OFFER_DETAIL_FIELDS } from "../../common/constants"
import { OfferDetail } from "../../common/types"
import { EditOfferForm } from "./edit-offer-form"

export const OfferEditPage = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const {
    offer,
    isPending,
    isError,
    error,
  } = useOffer(id!, { fields: OFFER_DETAIL_FIELDS })

  if (isError) throw error

  const ready = !isPending && !!offer

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("offers.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("offers.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditOfferForm offer={offer as OfferDetail} />}
    </RouteDrawer>
  )
}

export const Component = OfferEditPage
