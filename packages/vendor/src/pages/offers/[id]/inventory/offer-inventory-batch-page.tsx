import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../../components/modals"
import { useOffer } from "../../../../hooks/api/offers"
import { OFFER_DETAIL_FIELDS } from "../../common/constants"
import { OfferDetail } from "../../common/types"
import { InventoryBatchForm } from "./inventory-batch-form"

export const OfferInventoryBatchPage = () => {
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
          <Heading>{t("offers.inventory.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("offers.inventory.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <InventoryBatchForm offer={offer as OfferDetail} />}
    </RouteDrawer>
  )
}

export const Component = OfferInventoryBatchPage
