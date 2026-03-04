import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { CommissionRateListDataTable } from "./commission-rate-list-data-table"
import { CommissionRateListHeader } from "./commission-rate-list-header"

export { CommissionRateListDataTable } from "./commission-rate-list-data-table"
export {
  CommissionRateListHeader,
  CommissionRateListTitle,
  CommissionRateListActions,
} from "./commission-rate-list-header"

export const CommissionRateListView = ({
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
          <CommissionRateListHeader />
          <CommissionRateListDataTable />
        </>
      )}
    </Container>
  )
}
