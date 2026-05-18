import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ProductBrandListView,
  ProductBrandListDataTable,
  ProductBrandListHeader,
  ProductBrandListActions,
  ProductBrandListTitle,
} from "./components/product-brand-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <ProductBrandListView />}
    </SingleColumnPage>
  )
}

export const ProductBrandListPage = Object.assign(Root, {
  Table: ProductBrandListView,
  Header: ProductBrandListHeader,
  HeaderTitle: ProductBrandListTitle,
  HeaderActions: ProductBrandListActions,
  DataTable: ProductBrandListDataTable,
})
