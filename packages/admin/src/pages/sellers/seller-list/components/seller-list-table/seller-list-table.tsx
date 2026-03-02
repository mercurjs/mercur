import { Children, ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { SellerListHeader } from "./seller-list-header"
import { SellerListDataTable } from "./seller-list-data-table"

export { SellerListDataTable } from "./seller-list-data-table"
export {
  SellerListHeader,
  SellerListTitle,
  SellerListActions,
} from "./seller-list-header"

export const SellerListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <SellerListHeader />
          <SellerListDataTable />
        </>
      )}
    </Container>
  )
}
