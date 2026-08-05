import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useLinkQuery } from "@mercurjs/dashboard-shared"

import { RouteFocusModal } from "../../../../../../components/modals"
import { useOffer } from "../../../../../../hooks/api/offers"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../../common/constants"
import { OfferDetail } from "../../../../common/types"
import { ManageOfferInventoryItemsForm } from "./manage-offer-inventory-items-form"

export const OfferManageInventoryItemsPage = () => {
  const { offer_id } = useParams()
  const { t } = useTranslation()
  const query = useLinkQuery("offer", OFFER_VARIANT_DETAIL_FIELDS)
  const { offer, isPending, isError, error } = useOffer(offer_id!, query)

  if (isError) {
    throw error
  }

  const ready = !isPending && !!offer

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("offers.inventory.itemsHeading")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("offers.inventory.defineHint")}</span>
      </RouteFocusModal.Description>
      {ready && (
        <ManageOfferInventoryItemsForm offer={offer as OfferDetail} />
      )}
    </RouteFocusModal>
  )
}

export const Component = OfferManageInventoryItemsPage
