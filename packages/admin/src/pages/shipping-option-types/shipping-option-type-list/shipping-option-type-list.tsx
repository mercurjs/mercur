import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { ShippingOptionTypeListTable } from "./components/shipping-option-type-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <ShippingOptionTypeListTable />
      )}
    </SingleColumnPage>
  )
}

export const ShippingOptionTypeList = Object.assign(Root, {
  Table: ShippingOptionTypeListTable,
})
