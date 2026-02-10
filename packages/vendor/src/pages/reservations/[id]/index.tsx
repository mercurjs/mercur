// Route: /reservations/:id
import { useLoaderData, useParams, LoaderFunctionArgs } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { useReservationItem, reservationItemsQueryKeys } from "@hooks/api/reservations"
import { useInventoryItem } from "@hooks/api"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { ReservationGeneralSection } from "./_components/reservation-general-section"
import { InventoryItemGeneralSection } from "../../inventory/[id]/_components/inventory-item-general-section"

const reservationDetailQuery = (id: string) => ({
  queryKey: reservationItemsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/reservations/${id}`, {
      method: "GET",
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = reservationDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}

type ReservationDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminReservationResponse>

export const Breadcrumb = (props: ReservationDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { reservation } = useReservationItem(id!, undefined, {
    initialData: props.data,
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

  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const { reservation, isLoading, isError, error } = useReservationItem(
    id!,
    undefined,
    {
      initialData,
    }
  )

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

  if (isError) {
    throw error
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
