import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { RegionListDataTable } from "./region-list-data-table"
import { RegionListHeader } from "./region-list-header"

export { RegionListDataTable } from "./region-list-data-table"
export {
  RegionListHeader,
  RegionListTitle,
  RegionListActions,
} from "./region-list-header"

export const RegionListView = ({
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
          <RegionListHeader />
          <RegionListDataTable />
        </>
      )}
    </Container>
  )
}
