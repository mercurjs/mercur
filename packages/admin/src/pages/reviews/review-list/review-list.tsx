import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ReviewListDataTable,
  ReviewListHeader,
  ReviewListTable,
  ReviewListTitle,
} from "./components/review-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <ReviewListTable />}
    </SingleColumnPage>
  )
}

export const ReviewListPage = Object.assign(Root, {
  Table: ReviewListTable,
  Header: ReviewListHeader,
  HeaderTitle: ReviewListTitle,
  DataTable: ReviewListDataTable,
})
