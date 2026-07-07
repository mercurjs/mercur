import { Children, ReactNode } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../components/layout/pages"
import {
  OfferListActions,
  OfferListDataTable,
  OfferListHeader,
  OfferListTable,
  OfferListTitle,
} from "./_components"

const Root = ({ children }: { children?: ReactNode }) => (
  <SingleColumnPage>
    <WidgetZone id="offers.list">
      {Children.count(children) > 0 ? children : <OfferListTable />}
    </WidgetZone>
  </SingleColumnPage>
)

export const OfferListPage = Object.assign(Root, {
  Table: OfferListTable,
  Header: OfferListHeader,
  HeaderTitle: OfferListTitle,
  HeaderActions: OfferListActions,
  DataTable: OfferListDataTable,
})
