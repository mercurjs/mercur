import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  CategoryListTable,
  CategoryListDataTable,
  CategoryListHeader,
  CategoryListActions,
  CategoryListTitle,
} from "./components/category-list-table"

const ALLOWED_TYPES = [CategoryListTable] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <CategoryListTable />}
    </SingleColumnPage>
  )
}

export const CategoryList = Object.assign(Root, {
  Table: CategoryListTable,
  Header: CategoryListHeader,
  HeaderTitle: CategoryListTitle,
  HeaderActions: CategoryListActions,
  DataTable: CategoryListDataTable,
})
