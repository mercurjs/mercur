import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { CommissionRateListDataTable } from "./commission-rate-list-data-table"
import { CommissionRateListHeader } from "./commission-rate-list-header"

export { CommissionRateListDataTable } from "./commission-rate-list-data-table"
export {
  CommissionRateListHeader,
  CommissionRateListTitle,
  CommissionRateListActions,
} from "./commission-rate-list-header"

const TABLE_ALLOWED_TYPES = [
  CommissionRateListHeader,
  CommissionRateListDataTable,
] as const

export const CommissionRateListView = ({
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
          <CommissionRateListHeader />
          <CommissionRateListDataTable />
        </>
      )}
    </Container>
  )
}
