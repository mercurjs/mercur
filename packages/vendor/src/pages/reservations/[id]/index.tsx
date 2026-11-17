// Route: /reservations/:id
import { useParams } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  detailPageDefaultEntries,
  LayoutComposer,
  useCan,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"
import { useReservationItem } from "@hooks/api/reservations"
import { useInventoryItem } from "@hooks/api"
import { ReservationGeneralSection } from "./_components/reservation-general-section"
import { ReservationInventorySection } from "./_components/reservation-inventory-section"

type ReservationDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminReservationResponse>

export const Breadcrumb = (props: ReservationDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { reservation } = useReservationItem(id!, undefined, {
    enabled: Boolean(id),
  })

  if (!reservation) {
    return null
  }

  const display =
    reservation?.inventory_item?.title ??
    reservation?.inventory_item?.sku ??
    reservation.id

  return <span>{display}</span>
}

export const Component = () => {
  const { id } = useParams()

  const { reservation, isLoading } = useReservationItem(
    id!,
    useLinkQuery("reservation")
  )

  // TEMP: fetch directly since the fields are not populated with reservation call
  const canViewItem = useCan("inventory_items")
  const { inventory_item } = useInventoryItem(
    reservation?.inventory_item?.id,
    useLinkQuery("inventory_item", "*location_levels"),
    { enabled: canViewItem }
  )

  if (isLoading || !reservation) {
    return (
      <TwoColumnPageSkeleton
        mainSections={1}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    )
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="reservations.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={reservation}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="ReservationGeneralSection">
              <ReservationGeneralSection reservation={reservation} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(reservation)}
          </>
        ),
        side: inventory_item && (
          <LayoutComposer.Entry id="ReservationInventorySection">
            <ReservationInventorySection inventoryItem={inventory_item!} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  )
}
