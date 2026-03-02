import { Children, ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { CollectionListHeader } from "./collection-list-header"
import { CollectionListDataTable } from "./collection-list-data-table"

export { CollectionListDataTable } from "./collection-list-data-table"
export {
  CollectionListHeader,
  CollectionListTitle,
  CollectionListActions,
} from "./collection-list-header"

export const CollectionListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
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
