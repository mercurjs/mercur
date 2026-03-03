import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { TaxRegionListDataTable } from "./tax-region-list-data-table"
import { TaxRegionListHeader } from "./tax-region-list-header"

export { TaxRegionListDataTable } from "./tax-region-list-data-table"
export {
  TaxRegionListHeader,
  TaxRegionListTitle,
  TaxRegionListActions,
} from "./tax-region-list-header"

export const TaxRegionListView = ({
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
          <TaxRegionListHeader />
          <TaxRegionListDataTable />
        </>
      )}
    </Container>
  )
}
