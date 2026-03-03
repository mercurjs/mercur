import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { RegionListDataTable } from "./region-list-data-table"
import { RegionListHeader } from "./region-list-header"

export { RegionListDataTable } from "./region-list-data-table"
export {
  RegionListHeader,
  RegionListTitle,
  RegionListActions,
} from "./region-list-header"

const TABLE_ALLOWED_TYPES = [
  RegionListHeader,
  RegionListDataTable,
] as const

export const RegionListView = ({
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
          <RegionListHeader />
          <RegionListDataTable />
        </>
      )}
    </Container>
  )
}
