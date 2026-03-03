import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { ShippingProfileListTable } from "./components/shipping-profile-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <ShippingProfileListTable />
      )}
    </SingleColumnPage>
  )
}

export const ShippingProfileList = Object.assign(Root, {
  Table: ShippingProfileListTable,
})
