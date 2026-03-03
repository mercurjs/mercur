import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ProductTagListView,
  ProductTagListDataTable,
  ProductTagListHeader,
  ProductTagListActions,
  ProductTagListTitle,
} from "./components/product-tag-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      {Children.count(children) > 0 ? children : <ProductTagListView />}
    </SingleColumnPage>
  )
}

export const ProductTagListPage = Object.assign(Root, {
  Table: ProductTagListView,
  Header: ProductTagListHeader,
  HeaderTitle: ProductTagListTitle,
  HeaderActions: ProductTagListActions,
  DataTable: ProductTagListDataTable,
})
