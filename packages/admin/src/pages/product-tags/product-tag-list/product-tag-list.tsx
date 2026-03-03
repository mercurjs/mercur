import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  ProductTagListView,
  ProductTagListDataTable,
  ProductTagListHeader,
  ProductTagListActions,
  ProductTagListTitle,
} from "./components/product-tag-list-view"

const ALLOWED_TYPES = [ProductTagListView] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <ProductTagListView />}
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
