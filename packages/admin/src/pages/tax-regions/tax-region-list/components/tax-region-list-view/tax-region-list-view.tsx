import { Children, ReactNode } from "react"

import { TaxRegionListDataTable } from "./tax-region-list-data-table"

export { TaxRegionListDataTable } from "./tax-region-list-data-table"
export {
  TaxRegionListHeader,
  TaxRegionListTitle,
  TaxRegionListActions,
} from "./tax-region-list-header"

export const TaxRegionListView = ({ children }: { children?: ReactNode }) => {
  return Children.count(children) > 0 ? (
    <>{children}</>
  ) : (
    <TaxRegionListDataTable />
  )
}
