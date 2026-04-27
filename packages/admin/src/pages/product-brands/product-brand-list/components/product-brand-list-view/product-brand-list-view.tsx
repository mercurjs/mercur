import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { ProductBrandListDataTable } from "./product-brand-list-data-table"
import { ProductBrandListHeader } from "./product-brand-list-header"

export { ProductBrandListDataTable } from "./product-brand-list-data-table"
export {
  ProductBrandListHeader,
  ProductBrandListTitle,
  ProductBrandListActions,
} from "./product-brand-list-header"

export const ProductBrandListView = ({
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
          <ProductBrandListHeader />
          <ProductBrandListDataTable />
        </>
      )}
    </Container>
  )
}
