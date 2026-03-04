import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { ShippingProfileListDataTable } from "./shipping-profile-list-data-table"
import { ShippingProfileListHeader } from "./shipping-profile-list-header"

export { ShippingProfileListDataTable } from "./shipping-profile-list-data-table"
export {
  ShippingProfileListHeader,
  ShippingProfileListTitle,
  ShippingProfileListActions,
} from "./shipping-profile-list-header"

export const ShippingProfileListView = ({
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
          <ShippingProfileListHeader />
          <ShippingProfileListDataTable />
        </>
      )}
    </Container>
  )
}
