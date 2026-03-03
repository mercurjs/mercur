import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  PriceListListTable,
  PriceListListDataTable,
  PriceListListHeader,
  PriceListListActions,
  PriceListListTitle,
} from "./components/price-list-list-table"

const ALLOWED_TYPES = [PriceListListTable] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <PriceListListTable />}
    </SingleColumnPage>
  )
}

export const PriceListList = Object.assign(Root, {
  Table: PriceListListTable,
  Header: PriceListListHeader,
  HeaderTitle: PriceListListTitle,
  HeaderActions: PriceListListActions,
  DataTable: PriceListListDataTable,
})
