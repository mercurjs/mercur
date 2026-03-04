import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { ProductTypeListDataTable } from "./product-type-list-data-table"
import { ProductTypeListHeader } from "./product-type-list-header"

export { ProductTypeListDataTable } from "./product-type-list-data-table"
export {
  ProductTypeListHeader,
  ProductTypeListTitle,
  ProductTypeListActions,
} from "./product-type-list-header"

export const ProductTypeListView = ({
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
          <ProductTypeListHeader />
          <ProductTypeListDataTable />
        </>
      )}
    </Container>
  )
}
