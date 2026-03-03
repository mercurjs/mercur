import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ProductTypeListView,
  ProductTypeListDataTable,
  ProductTypeListHeader,
  ProductTypeListActions,
  ProductTypeListTitle,
} from "./components/product-type-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <ProductTypeListView />}
    </SingleColumnPage>
  )
}

export const ProductTypeListPage = Object.assign(Root, {
  Table: ProductTypeListView,
  Header: ProductTypeListHeader,
  HeaderTitle: ProductTypeListTitle,
  HeaderActions: ProductTypeListActions,
  DataTable: ProductTypeListDataTable,
})
