// Route: /reservations/:id
import { useParams } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { useReservationItem } from "@hooks/api/reservations"
import { useInventoryItem } from "@hooks/api"
import { ReservationGeneralSection } from "./_components/reservation-general-section"
import { InventoryItemGeneralSection } from "../../inventory/[id]/_components/inventory-item-general-section"

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

  const { reservation, isLoading } = useReservationItem(id!)

  // TEMP: fetch directly since the fields are not populated with reservation call
  const { inventory_item } = useInventoryItem(
    reservation?.inventory_item?.id!,
    { fields: "*location_levels" }
  )

  const { getWidgets } = useDashboardExtension()

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
    <TwoColumnPage
      widgets={{
        before: getWidgets("reservation.details.before"),
        after: getWidgets("reservation.details.after"),
        sideBefore: getWidgets("reservation.details.side.before"),
        sideAfter: getWidgets("reservation.details.side.after"),
      }}
      data={reservation}
    >
      <TwoColumnPage.Main>
        <ReservationGeneralSection reservation={reservation} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        {inventory_item && (
          <InventoryItemGeneralSection inventoryItem={inventory_item!} />
        )}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
