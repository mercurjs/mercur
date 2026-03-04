import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { ShippingOptionTypeListDataTable } from "./shipping-option-type-list-data-table"
import { ShippingOptionTypeListHeader } from "./shipping-option-type-list-header"

export { ShippingOptionTypeListDataTable } from "./shipping-option-type-list-data-table"
export {
  ShippingOptionTypeListHeader,
  ShippingOptionTypeListTitle,
  ShippingOptionTypeListActions,
} from "./shipping-option-type-list-header"

export const ShippingOptionTypeListView = ({
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
          <ShippingOptionTypeListHeader />
          <ShippingOptionTypeListDataTable />
        </>
      )}
    </Container>
  )
}
