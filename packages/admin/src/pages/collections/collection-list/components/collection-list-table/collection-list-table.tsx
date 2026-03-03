import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { CollectionListHeader } from "./collection-list-header"
import { CollectionListDataTable } from "./collection-list-data-table"

export { CollectionListDataTable } from "./collection-list-data-table"
export {
  CollectionListHeader,
  CollectionListTitle,
  CollectionListActions,
} from "./collection-list-header"

const TABLE_ALLOWED_TYPES = [CollectionListHeader, CollectionListDataTable] as const

export const CollectionListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {hasExplicitCompoundComposition(children, TABLE_ALLOWED_TYPES) ? (
        children
      ) : (
        <>
          <CollectionListHeader />
          <CollectionListDataTable />
        </>
      )}
    </Container>
  )
}
