import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useInventoryItem } from "../../../hooks/api"
import { useReservationItem } from "../../../hooks/api/reservations"

import { InventoryItemGeneralSection } from "../../inventory/inventory-detail/components/inventory-item-general-section"
import { ReservationGeneralSection } from "./components/reservation-general-section"
import { reservationItemLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof reservationItemLoader>
  >

  const { reservation, isLoading, isError, error } = useReservationItem(
    id!,
    undefined,
    {
      initialData,
    }
  )

  // TEMP: fetch directly since the fields are not populated with reservation call
  const { inventory_item } = useInventoryItem(
    reservation?.inventory_item?.id,
    undefined,
    { enabled: !!reservation?.inventory_item?.id }
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

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={reservation} showJSON showMetadata data-testid="reservation-detail-page">
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={reservation} showJSON showMetadata data-testid="reservation-detail-page">
      <TwoColumnPage.Main>
        <ReservationGeneralSection reservation={reservation} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        {inventory_item && (
          <InventoryItemGeneralSection inventoryItem={inventory_item} />
        )}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const ReservationDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: ReservationGeneralSection,
  SidebarInventorySection: InventoryItemGeneralSection,
})
