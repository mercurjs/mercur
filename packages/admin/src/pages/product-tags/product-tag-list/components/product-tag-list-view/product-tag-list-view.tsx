import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { ProductTagListDataTable } from "./product-tag-list-data-table"
import { ProductTagListHeader } from "./product-tag-list-header"

export { ProductTagListDataTable } from "./product-tag-list-data-table"
export {
  ProductTagListHeader,
  ProductTagListTitle,
  ProductTagListActions,
} from "./product-tag-list-header"

export const ProductTagListView = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
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
