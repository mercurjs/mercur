import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ReservationListTable,
  ReservationListHeader,
  ReservationListTitle,
  ReservationListActions,
  ReservationListCreateButton,
  ReservationListDataTable,
} from "./components/reservation-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <ReservationListTable />}
    </SingleColumnPage>
  )
}

export const ReservationListPage = Object.assign(Root, {
  Table: ReservationListTable,
  Header: ReservationListHeader,
  HeaderTitle: ReservationListTitle,
  HeaderActions: ReservationListActions,
  HeaderCreateButton: ReservationListCreateButton,
  DataTable: ReservationListDataTable,
})
