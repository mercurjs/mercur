import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { SellerListHeader } from "./seller-list-header"
import { SellerListDataTable } from "./seller-list-data-table"

export { SellerListDataTable } from "./seller-list-data-table"
export {
  SellerListHeader,
  SellerListTitle,
  SellerListActions,
} from "./seller-list-header"

const TABLE_ALLOWED_TYPES = [SellerListHeader, SellerListDataTable] as const

export const SellerListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {hasExplicitCompoundComposition(children, TABLE_ALLOWED_TYPES) ? (
        children
      ) : (
        <>
          <SellerListHeader />
          <SellerListDataTable />
        </>
      )}
    </Container>
  )
}
