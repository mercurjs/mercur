import { SingleColumnPage } from "../../../components/layout/pages"

import { ReservationListTable } from "./components/reservation-list-table"

export const ReservationList = () => {

  return (
    <SingleColumnPage
    >
      <ReservationListTable />
    </SingleColumnPage>
  )
}
