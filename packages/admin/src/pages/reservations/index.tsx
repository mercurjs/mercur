import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { ReservationListTable } from "./_components/reservation-list-table"

const ReservationList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("reservation.list.before"),
        after: getWidgets("reservation.list.after"),
      }}
    >
      <ReservationListTable />
    </SingleColumnPage>
  )
}

export const Component = ReservationList
