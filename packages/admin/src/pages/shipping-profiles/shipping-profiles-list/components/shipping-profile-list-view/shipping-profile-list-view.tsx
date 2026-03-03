import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { ShippingProfileListDataTable } from "./shipping-profile-list-data-table"
import { ShippingProfileListHeader } from "./shipping-profile-list-header"

export { ShippingProfileListDataTable } from "./shipping-profile-list-data-table"
export {
  ShippingProfileListHeader,
  ShippingProfileListTitle,
  ShippingProfileListActions,
} from "./shipping-profile-list-header"

const TABLE_ALLOWED_TYPES = [
  ShippingProfileListHeader,
  ShippingProfileListDataTable,
] as const

export const ShippingProfileListView = ({
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
          <ShippingProfileListHeader />
          <ShippingProfileListDataTable />
        </>
      )}
    </Container>
  )
}
