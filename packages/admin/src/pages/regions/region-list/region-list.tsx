import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  RegionListView,
  RegionListDataTable,
  RegionListHeader,
  RegionListActions,
  RegionListTitle,
} from "./components/region-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="regions.list">
        {Children.count(children) > 0 ? children : <RegionListView />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const RegionListPage = Object.assign(Root, {
  Table: RegionListView,
  Header: RegionListHeader,
  HeaderTitle: RegionListTitle,
  HeaderActions: RegionListActions,
  DataTable: RegionListDataTable,
})
