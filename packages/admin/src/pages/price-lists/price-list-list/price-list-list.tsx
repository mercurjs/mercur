import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  PriceListListTable,
  PriceListListDataTable,
  PriceListListHeader,
  PriceListListActions,
  PriceListListTitle,
} from "./components/price-list-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="price-lists.list">
        {Children.count(children) > 0 ? children : <PriceListListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const PriceListListPage = Object.assign(Root, {
  Table: PriceListListTable,
  Header: PriceListListHeader,
  HeaderTitle: PriceListListTitle,
  HeaderActions: PriceListListActions,
  DataTable: PriceListListDataTable,
})
