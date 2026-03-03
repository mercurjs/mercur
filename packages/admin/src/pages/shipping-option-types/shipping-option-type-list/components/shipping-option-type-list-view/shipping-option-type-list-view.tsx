import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { ShippingOptionTypeListDataTable } from "./shipping-option-type-list-data-table"
import { ShippingOptionTypeListHeader } from "./shipping-option-type-list-header"

export { ShippingOptionTypeListDataTable } from "./shipping-option-type-list-data-table"
export {
  ShippingOptionTypeListHeader,
  ShippingOptionTypeListTitle,
  ShippingOptionTypeListActions,
} from "./shipping-option-type-list-header"

const TABLE_ALLOWED_TYPES = [
  ShippingOptionTypeListHeader,
  ShippingOptionTypeListDataTable,
] as const

export const ShippingOptionTypeListView = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container className="divide-y p-0">
      {hasExplicitCompoundComposition(children, TABLE_ALLOWED_TYPES) ? (
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
