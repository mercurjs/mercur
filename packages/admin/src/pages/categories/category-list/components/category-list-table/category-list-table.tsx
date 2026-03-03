import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { CategoryListHeader } from "./category-list-header"
import { CategoryListDataTable } from "./category-list-data-table"

export { CategoryListDataTable } from "./category-list-data-table"
export {
  CategoryListHeader,
  CategoryListTitle,
  CategoryListActions,
} from "./category-list-header"

export const CategoryListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <CategoryListHeader />
          <CategoryListDataTable />
        </>
      )}
    </Container>
  )
}
