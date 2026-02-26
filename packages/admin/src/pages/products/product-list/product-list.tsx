import { Children, ReactNode } from "react"
import { SingleColumnPage } from "../../../components/layout/pages"
import { ProductListTable } from "./components/product-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <div data-testid="products-page">
      <SingleColumnPage>
        {Children.count(children) > 0 ? children : <ProductListTable />}
      </SingleColumnPage>
    </div>
  )
}

export const ProductList = Object.assign(Root, {
  Table: ProductListTable,
})
