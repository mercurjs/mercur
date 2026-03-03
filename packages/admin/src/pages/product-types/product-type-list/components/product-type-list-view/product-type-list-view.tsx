import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { ProductTypeListDataTable } from "./product-type-list-data-table"
import { ProductTypeListHeader } from "./product-type-list-header"

export { ProductTypeListDataTable } from "./product-type-list-data-table"
export {
  ProductTypeListHeader,
  ProductTypeListTitle,
  ProductTypeListActions,
} from "./product-type-list-header"

const TABLE_ALLOWED_TYPES = [
  ProductTypeListHeader,
  ProductTypeListDataTable,
] as const

export const ProductTypeListView = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container className="divide-y p-0">
      {hasExplicitCompoundComposition(children, TABLE_ALLOWED_TYPES) ? (
        children
      ) : (
        <>
          <ProductTypeListHeader />
          <ProductTypeListDataTable />
        </>
      )}
    </Container>
  )
}
