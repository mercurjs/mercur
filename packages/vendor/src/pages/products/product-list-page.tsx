import { Children, ReactNode } from "react"

import { SingleColumnPage } from "@components/layout/pages"

import {
  ProductListTable,
  ProductListDataTable,
  ProductListHeader,
  ProductListActions,
  ProductListTitle,
  ProductListCreateButton,
  ProductListImportButton,
  ProductListExportButton,
} from "./_components/product-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <ProductListTable />}
    </SingleColumnPage>
  )
}

export const ProductListPage = Object.assign(Root, {
  // Backward compat
  Table: ProductListTable,
  // Sections
  Header: ProductListHeader,
  Actions: ProductListActions,
  DataTable: ProductListDataTable,
  // Individual elements
  Title: ProductListTitle,
  CreateButton: ProductListCreateButton,
  ImportButton: ProductListImportButton,
  ExportButton: ProductListExportButton,
})
