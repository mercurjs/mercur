import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  CategoryListTable,
  CategoryListDataTable,
  CategoryListHeader,
  CategoryListActions,
  CategoryListTitle,
} from "./components/category-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <CategoryListTable />}
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
