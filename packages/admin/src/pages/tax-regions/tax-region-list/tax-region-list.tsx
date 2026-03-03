import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  TaxRegionListView,
  TaxRegionListDataTable,
  TaxRegionListHeader,
  TaxRegionListActions,
  TaxRegionListTitle,
} from "./components/tax-region-list-view"

const ALLOWED_TYPES = [TaxRegionListView] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <TaxRegionListView />}
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
