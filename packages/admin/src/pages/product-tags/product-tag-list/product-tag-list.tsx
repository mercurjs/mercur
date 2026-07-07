import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

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
      <WidgetZone id="product-tags.list">
        {Children.count(children) > 0 ? children : <ProductTagListView />}
      </WidgetZone>
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
