import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  RegionListView,
  RegionListDataTable,
  RegionListHeader,
  RegionListActions,
  RegionListTitle,
} from "./components/region-list-view"

const ALLOWED_TYPES = [RegionListView] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <RegionListView />}
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
