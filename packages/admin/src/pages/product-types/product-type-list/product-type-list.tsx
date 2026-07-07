import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

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
      <WidgetZone id="product-types.list">
        {Children.count(children) > 0 ? children : <ProductTypeListView />}
      </WidgetZone>
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
