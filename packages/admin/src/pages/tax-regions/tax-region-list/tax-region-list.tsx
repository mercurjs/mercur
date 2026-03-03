import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  TaxRegionListView,
  TaxRegionListDataTable,
  TaxRegionListHeader,
  TaxRegionListActions,
  TaxRegionListTitle,
} from "./components/tax-region-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <TaxRegionListView />}
    </SingleColumnPage>
  )
}

export const TaxRegionsList = Object.assign(Root, {
  Table: TaxRegionListView,
  Header: TaxRegionListHeader,
  HeaderTitle: TaxRegionListTitle,
  HeaderActions: TaxRegionListActions,
  DataTable: TaxRegionListDataTable,
})
