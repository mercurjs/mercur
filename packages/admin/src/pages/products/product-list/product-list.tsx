import { ReactNode } from "react"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  ProductListTable,
  ProductListHeader,
  ProductListTitle,
  ProductListActions,
  ProductListCreateButton,
  ProductListExportButton,
  ProductListImportButton,
  ProductListDataTable,
} from "./components/product-list-table"

const ALLOWED_TYPES = [ProductListTable] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <div data-testid="products-page">
      <SingleColumnPage>
        {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <ProductListTable />}
      </SingleColumnPage>
    </div>
  )
}

export const ProductListPage = Object.assign(Root, {
  Table: ProductListTable,
  Header: ProductListHeader,
  HeaderTitle: ProductListTitle,
  HeaderActions: ProductListActions,
  HeaderCreateButton: ProductListCreateButton,
  HeaderExportButton: ProductListExportButton,
  HeaderImportButton: ProductListImportButton,
  DataTable: ProductListDataTable,
})
