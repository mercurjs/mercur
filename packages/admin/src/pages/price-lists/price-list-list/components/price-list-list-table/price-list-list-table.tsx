import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { PriceListListHeader } from "./price-list-list-header"
import { PriceListListDataTable } from "./price-list-list-data-table"

export { PriceListListDataTable } from "./price-list-list-data-table"
export {
  PriceListListHeader,
  PriceListListTitle,
  PriceListListActions,
} from "./price-list-list-header"

const TABLE_ALLOWED_TYPES = [PriceListListHeader, PriceListListDataTable] as const

export const PriceListListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {hasExplicitCompoundComposition(children, TABLE_ALLOWED_TYPES) ? (
        children
      ) : (
        <>
          <PriceListListHeader />
          <PriceListListDataTable />
        </>
      )}
    </Container>
  )
}
