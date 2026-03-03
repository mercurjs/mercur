import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { CategoryListHeader } from "./category-list-header"
import { CategoryListDataTable } from "./category-list-data-table"

export { CategoryListDataTable } from "./category-list-data-table"
export {
  CategoryListHeader,
  CategoryListTitle,
  CategoryListActions,
} from "./category-list-header"

const TABLE_ALLOWED_TYPES = [CategoryListHeader, CategoryListDataTable] as const

export const CategoryListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {hasExplicitCompoundComposition(children, TABLE_ALLOWED_TYPES) ? (
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
