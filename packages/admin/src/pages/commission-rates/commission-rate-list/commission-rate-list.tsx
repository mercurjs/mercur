import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  CommissionRateListView,
  CommissionRateListDataTable,
  CommissionRateListHeader,
  CommissionRateListActions,
  CommissionRateListTitle,
} from "./components/commission-rate-list-view"

const ALLOWED_TYPES = [CommissionRateListView] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <CommissionRateListView />}
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
