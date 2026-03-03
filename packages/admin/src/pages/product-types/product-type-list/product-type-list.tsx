import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  ProductTypeListView,
  ProductTypeListDataTable,
  ProductTypeListHeader,
  ProductTypeListActions,
  ProductTypeListTitle,
} from "./components/product-type-list-view"

const ALLOWED_TYPES = [ProductTypeListView] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <ProductTypeListView />}
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
