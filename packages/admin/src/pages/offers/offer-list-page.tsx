import { Children, ReactNode } from "react"

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
    {Children.count(children) > 0 ? children : <OfferListTable />}
  </SingleColumnPage>
)

export const OfferListPage = Object.assign(Root, {
  Table: OfferListTable,
  Header: OfferListHeader,
  HeaderTitle: OfferListTitle,
  HeaderActions: OfferListActions,
  DataTable: OfferListDataTable,
})

export const Component = Root
