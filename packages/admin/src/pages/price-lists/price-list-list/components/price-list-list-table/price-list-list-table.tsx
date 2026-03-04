import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { PriceListListHeader } from "./price-list-list-header"
import { PriceListListDataTable } from "./price-list-list-data-table"

export { PriceListListDataTable } from "./price-list-list-data-table"
export {
  PriceListListHeader,
  PriceListListTitle,
  PriceListListActions,
} from "./price-list-list-header"

export const PriceListListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
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
