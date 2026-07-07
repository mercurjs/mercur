import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

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
      <WidgetZone id="tax-regions.list">
        {Children.count(children) > 0 ? children : <TaxRegionListView />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const TaxRegionListPage = Object.assign(Root, {
  Table: TaxRegionListView,
  Header: TaxRegionListHeader,
  HeaderTitle: TaxRegionListTitle,
  HeaderActions: TaxRegionListActions,
  DataTable: TaxRegionListDataTable,
})
