import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { TaxRegionListDataTable } from "./tax-region-list-data-table"
import { TaxRegionListHeader } from "./tax-region-list-header"

export { TaxRegionListDataTable } from "./tax-region-list-data-table"
export {
  TaxRegionListHeader,
  TaxRegionListTitle,
  TaxRegionListActions,
} from "./tax-region-list-header"

const TABLE_ALLOWED_TYPES = [
  TaxRegionListHeader,
  TaxRegionListDataTable,
] as const

export const TaxRegionListView = ({
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
          <TaxRegionListHeader />
          <TaxRegionListDataTable />
        </>
      )}
    </Container>
  )
}
