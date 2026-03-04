import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  CommissionRateListView,
  CommissionRateListDataTable,
  CommissionRateListHeader,
  CommissionRateListActions,
  CommissionRateListTitle,
} from "./components/commission-rate-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <CommissionRateListView />}
    </SingleColumnPage>
  )
}

export const CommissionRateListPage = Object.assign(Root, {
  Table: CommissionRateListView,
  Header: CommissionRateListHeader,
  HeaderTitle: CommissionRateListTitle,
  HeaderActions: CommissionRateListActions,
  DataTable: CommissionRateListDataTable,
})
