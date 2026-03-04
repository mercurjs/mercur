import { ReactNode, Children } from "react"

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
      {Children.count(children) > 0 ? children : <RegionListView />}
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
