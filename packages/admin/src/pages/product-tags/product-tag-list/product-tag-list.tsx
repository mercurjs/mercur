import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { ProductTagListTable } from "./components/product-tag-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      {Children.count(children) > 0 ? children : <ProductTagListTable />}
    </SingleColumnPage>
  )
}

export const ProductTagList = Object.assign(Root, {
  Table: ProductTagListTable,
})
