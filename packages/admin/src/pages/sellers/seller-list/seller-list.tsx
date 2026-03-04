import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  SellerListTable,
  SellerListDataTable,
  SellerListHeader,
  SellerListActions,
  SellerListTitle,
} from "./components/seller-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <SellerListTable />}
    </SingleColumnPage>
  )
}

export const SellerListPage = Object.assign(Root, {
  Table: SellerListTable,
  Header: SellerListHeader,
  HeaderTitle: SellerListTitle,
  HeaderActions: SellerListActions,
  DataTable: SellerListDataTable,
})
