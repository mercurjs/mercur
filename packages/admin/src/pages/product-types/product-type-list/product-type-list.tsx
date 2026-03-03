import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { ProductTypeListTable } from "./components/product-type-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <ProductTypeListTable />}
    </SingleColumnPage>
  )
}

export const ProductTypeList = Object.assign(Root, {
  Table: ProductTypeListTable,
})
