import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { ReservationListTable } from "./components/reservation-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <ReservationListTable />}
    </SingleColumnPage>
  )
}

export const ReservationList = Object.assign(Root, {
  Table: ReservationListTable,
})
