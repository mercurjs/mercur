import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { StoreListHeader } from "./store-list-header"
import { StoreListDataTable } from "./store-list-data-table"

export { StoreListDataTable } from "./store-list-data-table"
export {
  StoreListHeader,
  StoreListTitle,
  StoreListActions,
} from "./store-list-header"

export const StoreListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <StoreListHeader />
          <StoreListDataTable />
        </>
      )}
    </Container>
  )
}
