import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { ProductTagListDataTable } from "./product-tag-list-data-table"
import { ProductTagListHeader } from "./product-tag-list-header"

export { ProductTagListDataTable } from "./product-tag-list-data-table"
export {
  ProductTagListHeader,
  ProductTagListTitle,
  ProductTagListActions,
} from "./product-tag-list-header"

const TABLE_ALLOWED_TYPES = [
  ProductTagListHeader,
  ProductTagListDataTable,
] as const

export const ProductTagListView = ({
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
          <ProductTagListHeader />
          <ProductTagListDataTable />
        </>
      )}
    </Container>
  )
}
