import { HttpTypes } from "@medusajs/types"
import { SectionNoAccess, useCan } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "../../../../../../components/modals"
import { useOffer } from "../../../../../../hooks/api/offers"
import { useStockLocations } from "../../../../../../hooks/api/stock-locations"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../../common/constants"
import { OfferDetail } from "../../../../common/types"
import { InventoryBatchForm } from "../../../inventory/inventory-batch-form"

/** Manage Inventory Items modal for a single offer, from the variant detail. */
export const OfferVariantInventoryPage = () => {
  const { offer_id } = useParams()
  const { t } = useTranslation()
  const { offer, isPending, isError, error } = useOffer(offer_id!, {
    fields: OFFER_VARIANT_DETAIL_FIELDS,
  })
  const canViewLocations = useCan("stock_locations")
  const { stock_locations, isPending: isLocationsPending } = useStockLocations(
    {
      limit: 100,
    },
    { enabled: canViewLocations }
  )

  if (isError) throw error

  const ready =
    !isPending && !!offer && !isLocationsPending && !!stock_locations

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("offers.inventory.header")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("offers.inventory.description")}</span>
      </RouteFocusModal.Description>
      {!canViewLocations ? (
        <>
          <RouteFocusModal.Header />
          <RouteFocusModal.Body>
            <SectionNoAccess />
          </RouteFocusModal.Body>
        </>
      ) : (
        ready && (
          <InventoryBatchForm
            offer={offer as OfferDetail}
            locations={stock_locations as HttpTypes.AdminStockLocation[]}
          />
        )
      )}
    </RouteFocusModal>
  )
}

export const Component = OfferVariantInventoryPage
