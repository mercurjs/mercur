import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  SellerListTable,
  SellerListDataTable,
  SellerListHeader,
  SellerListActions,
  SellerListTitle,
} from "./components/seller-list-table"

const ALLOWED_TYPES = [SellerListTable] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <SellerListTable />}
    </SingleColumnPage>
  )
}

export const SellersList = Object.assign(Root, {
  Table: SellerListTable,
  Header: SellerListHeader,
  HeaderTitle: SellerListTitle,
  HeaderActions: SellerListActions,
  DataTable: SellerListDataTable,
})
