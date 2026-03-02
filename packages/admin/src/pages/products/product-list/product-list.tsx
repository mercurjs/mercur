import { Children, ReactNode } from "react"
import { SingleColumnPage } from "../../../components/layout/pages"
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

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <div data-testid="products-page">
      <SingleColumnPage>
        {Children.count(children) > 0 ? children : <ProductListTable />}
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
